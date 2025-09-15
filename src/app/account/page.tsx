'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import MobileHeader from '@/components/MobileHeader';
import { useAuth } from '@/hooks/useAuth';
import { PRICING } from '@/types';

interface UsageStats {
  thisMonth: {
    textTokens: number;
    imagesGenerated: number;
    estimatedCost: number;
  };
  allTime: {
    textTokens: number;
    imagesGenerated: number;
    totalSpent: number;
  };
}

function PaymentSuccessHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const diamonds = searchParams.get('diamonds');

    if (success === 'true' && diamonds) {
      alert(`決済が完了しました！${parseInt(diamonds).toLocaleString()}ダイヤが追加されました。`);
      // URLからパラメータを削除
      window.history.replaceState({}, '', '/account');
    }
  }, [searchParams]);

  return null;
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const [usageStats] = useState<UsageStats>({
    thisMonth: { textTokens: 0, imagesGenerated: 0, estimatedCost: 0 },
    allTime: { textTokens: 0, imagesGenerated: 0, totalSpent: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);

  // 認証が必要なページなので、未ログインの場合はリダイレクト
  useEffect(() => {
    if (!user) {
      window.location.href = '/';
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseDiamonds = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('認証情報が取得できませんでした');
      }

      const idToken = await currentUser.getIdToken();
      const amount = 500; // ¥500

      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済セッションの作成に失敗しました');
      }

      // Stripe決済ページにリダイレクト
      window.location.href = data.url;

    } catch (error) {
      console.error('決済エラー:', error);
      alert(error instanceof Error ? error.message : '決済の開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <Suspense fallback={<div>Loading...</div>}>
          <PaymentSuccessHandler />
        </Suspense>
        <MobileHeader />
        <PageLayout
          title="アカウント"
          subtitle="ログインが必要です"
          currentPage="text"
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                アカウントページを表示するにはログインが必要です
              </p>
              <Link
                href="/"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        </PageLayout>
      </>
    );
  }

  const nextFreeUseDate = user.lastUsed
    ? new Date(new Date(user.lastUsed).getTime() + (PRICING.FREE_USER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000))
    : null;

  const canUseFree = !user.lastUsed || (nextFreeUseDate && nextFreeUseDate <= new Date());

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <PaymentSuccessHandler />
      </Suspense>
      <MobileHeader />

      <PageLayout
        title="アカウント"
        subtitle="ユーザー情報と利用状況"
        currentPage="text"
      >
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* ユーザー情報 */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  ユーザー情報
                </h2>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isLoading ? 'ログアウト中...' : 'ログアウト'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {user.displayName || 'ユーザー'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">プラン:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        ダイヤベースプラン
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">登録日:</span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                      ダイヤ残高
                    </h4>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">💎</span>
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {(user.diamonds || 0).toLocaleString()}
                      </span>
                      <span className="text-blue-700 dark:text-blue-300 text-sm">ダイヤ</span>
                    </div>
                    <button
                      onClick={handlePurchaseDiamonds}
                      disabled={isLoading}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      {isLoading ? '処理中...' : 'ダイヤを追加購入'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 利用統計 */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                利用統計
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">今月の利用状況</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>⚖️</span> テキスト生成
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {(user.monthlyUsage?.textTokens || 0).toLocaleString()} tokens
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>🖼️</span> 画像生成
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {(user.monthlyUsage?.imagesGenerated || 0).toLocaleString()} 画像
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">推定コスト</span>
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">
                          計算中...
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                        <span>消費ダイヤ</span>
                        <span>
                          計算中...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">累計利用状況</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>⚖️</span> テキスト生成
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {(user.totalUsage?.textTokens || 0).toLocaleString()} tokens
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>🖼️</span> 画像生成
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {(user.totalUsage?.imagesGenerated || 0).toLocaleString()} 画像
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* プランアップグレード */}
            {user.membershipType === 'free' && (
              <section className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-bold mb-4">より多くの利用には従量課金プランがおすすめ</h2>
                <p className="text-blue-100 mb-6">
                  ダイヤを購入すると、利用制限なしでAIモデルを比較できます。使った分だけのお支払いで、無駄がありません。
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handlePurchaseDiamonds}
                    disabled={isLoading}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 disabled:bg-blue-50 transition-colors"
                  >
                    {isLoading ? '処理中...' : 'ダイヤを購入'}
                  </button>
                  <a
                    href="/pricing"
                    className="bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-lg font-semibold transition-colors border-2 border-blue-400 text-center"
                  >
                    料金プランを見る
                  </a>
                </div>
              </section>
            )}

            {/* 設定・その他 */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                設定・その他
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">通知設定</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">メール通知の設定</p>
                  </div>
                  <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                    設定（準備中）
                  </button>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">データのエクスポート</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">利用履歴をダウンロード</p>
                  </div>
                  <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                    エクスポート（準備中）
                  </button>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">アカウント削除</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">すべてのデータが削除されます</p>
                  </div>
                  <button className="text-red-500 hover:text-red-600 text-sm font-medium">
                    削除（準備中）
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageLayout>
    </>
  );
}