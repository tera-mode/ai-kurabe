'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  diamonds: number;
  membershipType: 'free' | 'paid';
  plan?: string;
  createdAt: string;
  lastLoginAt?: string;
  totalUsage?: {
    textTokens: number;
    imagesGenerated: number;
  };
  monthlyUsage?: {
    textTokens: number;
    imagesGenerated: number;
  };
  nextFreeDate?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [diamondAmount, setDiamondAmount] = useState<string>('');
  const [isAddingDiamonds, setIsAddingDiamonds] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipChangeUser, setMembershipChangeUser] = useState<string | null>(null);
  const [newMembershipType, setNewMembershipType] = useState<'free' | 'paid'>('paid');
  const [isChangingMembership, setIsChangingMembership] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ユーザー一覧の取得に失敗しました');
      }

      setUsers(data.users);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const addDiamonds = async (userId: string) => {
    if (!diamondAmount || isNaN(Number(diamondAmount))) {
      alert('有効な数値を入力してください');
      return;
    }

    const amount = Number(diamondAmount);
    if (amount <= 0) {
      alert('正の数値を入力してください');
      return;
    }

    try {
      setIsAddingDiamonds(true);

      const response = await fetch('/api/admin/add-diamonds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          diamonds: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ダイヤ追加に失敗しました');
      }

      // ユーザー一覧を更新
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, diamonds: data.newDiamonds }
            : user
        )
      );

      setSelectedUser(null);
      setDiamondAmount('');
      alert(`${amount}ダイヤを追加しました`);

    } catch (error) {
      alert(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsAddingDiamonds(false);
    }
  };

  const changeMembershipType = async (userId: string) => {
    try {
      setIsChangingMembership(true);

      const response = await fetch('/api/admin/change-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          membershipType: newMembershipType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'メンバーシップ変更に失敗しました');
      }

      // ユーザー一覧を更新
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, membershipType: newMembershipType }
            : user
        )
      );

      setMembershipChangeUser(null);
      alert(`メンバーシップを${newMembershipType === 'paid' ? '有料' : '無料'}プランに変更しました`);

    } catch (error) {
      alert(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsChangingMembership(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                👥 ユーザー管理
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                登録ユーザーの管理とダイヤ残高の調整
              </p>
            </div>
            <Link
              href="/debug"
              className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← デバッグTOPに戻る
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* 検索・統計 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ユーザー検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="メールアドレスまたは表示名で検索"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {users.length}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  総ユーザー数
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {users.filter(u => u.membershipType === 'paid').length}
                </div>
                <div className="text-sm text-green-800 dark:text-green-300">
                  有料ユーザー
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ユーザー一覧 ({filteredUsers.length}件)
            </h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? '検索条件に一致するユーザーが見つかりません' : 'ユーザーが見つかりません'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      ユーザー情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      プラン・残高
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      利用統計
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      最終ログイン
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {user.displayName || '未設定'}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {user.email}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.membershipType === 'paid'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {user.membershipType === 'paid' ? '💎 有料' : '🆓 無料'}
                            </span>
                            {user.plan && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {user.plan}
                              </span>
                            )}
                          </div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {user.diamonds.toLocaleString()} ダイヤ
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            ≈ ¥{Math.floor(user.diamonds / 10)}
                          </div>
                          {user.nextFreeDate && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              次回無料: {new Date(user.nextFreeDate).toLocaleDateString('ja-JP')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">今月:</span>
                            <span className="text-slate-900 dark:text-slate-100">
                              {user.monthlyUsage?.textTokens || 0}T / {user.monthlyUsage?.imagesGenerated || 0}画像
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">累計:</span>
                            <span className="text-slate-900 dark:text-slate-100">
                              {user.totalUsage?.textTokens || 0}T / {user.totalUsage?.imagesGenerated || 0}画像
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-slate-900 dark:text-slate-100">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '未記録'
                            }
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            登録: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(user.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            ダイヤ追加
                          </button>
                          <button
                            onClick={() => {
                              setMembershipChangeUser(user.id);
                              setNewMembershipType(user.membershipType === 'paid' ? 'free' : 'paid');
                            }}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              user.membershipType === 'paid'
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {user.membershipType === 'paid' ? '無料化' : '有料化'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ダイヤ追加モーダル */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                💎 ダイヤ追加
              </h3>

              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  対象ユーザー:
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {users.find(u => u.id === selectedUser)?.email}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  現在の残高: {users.find(u => u.id === selectedUser)?.diamonds.toLocaleString()} ダイヤ
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  追加するダイヤ数
                </label>
                <input
                  type="number"
                  value={diamondAmount}
                  onChange={(e) => setDiamondAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="例: 1000"
                  min="1"
                  disabled={isAddingDiamonds}
                />
                {diamondAmount && !isNaN(Number(diamondAmount)) && Number(diamondAmount) > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    追加後残高: {(users.find(u => u.id === selectedUser)?.diamonds || 0) + Number(diamondAmount)} ダイヤ
                    （≈ ¥{Math.floor(((users.find(u => u.id === selectedUser)?.diamonds || 0) + Number(diamondAmount)) / 10)}）
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setDiamondAmount('');
                  }}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={isAddingDiamonds}
                >
                  キャンセル
                </button>
                <button
                  onClick={() => addDiamonds(selectedUser)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={isAddingDiamonds || !diamondAmount || isNaN(Number(diamondAmount)) || Number(diamondAmount) <= 0}
                >
                  {isAddingDiamonds ? '追加中...' : '追加する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* メンバーシップ変更モーダル */}
        {membershipChangeUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                📋 メンバーシップ変更
              </h3>

              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  対象ユーザー:
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {users.find(u => u.id === membershipChangeUser)?.email}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  現在: {users.find(u => u.id === membershipChangeUser)?.membershipType === 'paid' ? '有料プラン' : '無料プラン'}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  変更後のプラン
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="membershipType"
                      value="free"
                      checked={newMembershipType === 'free'}
                      onChange={(e) => setNewMembershipType(e.target.value as 'free' | 'paid')}
                      className="mr-2"
                      disabled={isChangingMembership}
                    />
                    <span className="text-sm text-slate-900 dark:text-slate-100">🆓 無料プラン</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="membershipType"
                      value="paid"
                      checked={newMembershipType === 'paid'}
                      onChange={(e) => setNewMembershipType(e.target.value as 'free' | 'paid')}
                      className="mr-2"
                      disabled={isChangingMembership}
                    />
                    <span className="text-sm text-slate-900 dark:text-slate-100">💎 有料プラン</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMembershipChangeUser(null);
                  }}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={isChangingMembership}
                >
                  キャンセル
                </button>
                <button
                  onClick={() => changeMembershipType(membershipChangeUser)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={isChangingMembership}
                >
                  {isChangingMembership ? '変更中...' : '変更する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}