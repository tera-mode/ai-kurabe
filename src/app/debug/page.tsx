'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DebugPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // 認証状態をチェック
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('認証状態チェックエラー:', error);
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError(data.error || '認証に失敗しました');
      }
    } catch (error) {
      setError('認証処理でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              管理者認証
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              デバッグ画面にアクセスするには管理者パスワードが必要です
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                管理者パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                placeholder="パスワードを入力"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {isLoading ? '認証中...' : '認証'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              ← ホームに戻る
            </Link>
          </div>
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
                🛠️ AIくらべ デバッグ画面
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                システム管理・監視用のデバッグコンソール
              </p>
            </div>
            <Link
              href="/"
              className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← ホームに戻る
            </Link>
          </div>
        </div>

        {/* メインメニュー */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ユーザー管理 */}
          <Link href="/debug/users" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    ユーザー管理
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    登録ユーザーの管理
                  </p>
                </div>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• ユーザー一覧表示</li>
                <li>• ダイヤ残高管理</li>
                <li>• プラン変更</li>
                <li>• 利用統計確認</li>
              </ul>
            </div>
          </Link>

          {/* AI管理 */}
          <Link href="/debug/ai" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    AI管理
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AIモデルの管理
                  </p>
                </div>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• モデル利用統計</li>
                <li>• API呼び出し状況</li>
                <li>• エラーログ確認</li>
                <li>• パフォーマンス監視</li>
              </ul>
            </div>
          </Link>

          {/* システム情報 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  システム情報
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  現在のシステム状態
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">環境:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {process.env.NODE_ENV || 'development'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">認証状態:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  認証済み
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">セッション:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  24時間有効
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-8">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
            <div className="text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                管理者権限での操作について
              </div>
              <p className="text-yellow-700 dark:text-yellow-300">
                この画面では重要なシステムデータにアクセス・変更が可能です。操作には十分注意し、
                本番環境での変更は必ず事前に影響を確認してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}