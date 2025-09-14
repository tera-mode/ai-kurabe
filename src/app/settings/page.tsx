'use client';

import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import MobileHeader from '@/components/MobileHeader';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    marketing: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // 認証が必要なページなので、未ログインの場合はリダイレクト
  useEffect(() => {
    if (!user) {
      window.location.href = '/';
    }
  }, [user]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: 設定をFirestoreに保存
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      alert('設定を保存しました（モック動作）');
    } catch (error) {
      console.error('Settings save error:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <MobileHeader />
        <PageLayout
          title="設定"
          subtitle="ログインが必要です"
          currentPage="text"
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                設定ページを表示するにはログインが必要です
              </p>
              <a
                href="/"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                ホームに戻る
              </a>
            </div>
          </div>
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <MobileHeader />

      <PageLayout
        title="設定"
        subtitle="アプリケーションの設定"
        currentPage="text"
      >
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* 外観設定 */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                外観設定
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                    テーマ
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'ライト', icon: '☀️' },
                      { id: 'dark', label: 'ダーク', icon: '🌙' },
                      { id: 'system', label: 'システム', icon: '💻' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id as any)}
                        className={`
                          p-4 rounded-lg border-2 transition-all text-center
                          ${theme === option.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                          }
                        `}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-medium">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 通知設定 */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                通知設定
              </h2>

              <div className="space-y-4">
                {[
                  {
                    key: 'email' as keyof typeof notifications,
                    title: 'メール通知',
                    description: '重要な更新やお知らせをメールで受け取る'
                  },
                  {
                    key: 'browser' as keyof typeof notifications,
                    title: 'ブラウザ通知',
                    description: 'ブラウザのプッシュ通知を受け取る'
                  },
                  {
                    key: 'marketing' as keyof typeof notifications,
                    title: 'マーケティング情報',
                    description: '新機能や特別オファーの情報を受け取る'
                  }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({
                        ...prev,
                        [item.key]: !prev[item.key]
                      }))}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${notifications[item.key] ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}
                      `}
                    >
                      <div className={`
                        absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform top-0.5
                        ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'}
                      `} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* データ設定 */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                データ設定
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">チャット履歴の保存</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      会話履歴をサーバーに保存して再利用可能にします
                    </p>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">準備中</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">画像履歴の保存</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      生成した画像をクラウドに保存します
                    </p>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">準備中</span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">利用統計の収集</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      サービス改善のため匿名の利用統計を収集します
                    </p>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">準備中</span>
                </div>
              </div>
            </section>

            {/* API設定 */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                API設定（将来追加予定）
              </h2>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  将来的に、個人のAPIキーを使用してより多くのAIモデルにアクセスできるようになります。
                </p>
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    • OpenAI API Key
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    • Anthropic API Key
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    • Google AI API Key
                  </div>
                </div>
              </div>
            </section>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? '保存中...' : '設定を保存'}
              </button>
            </div>

            {/* 情報 */}
            <section className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                🚀 開発中の機能について
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                多くの設定項目は現在開発中です。今後のアップデートでより多くのカスタマイズオプションが追加されます。
                ご要望やフィードバックがございましたら、お気軽にお知らせください。
              </p>
            </section>
          </div>
        </div>
      </PageLayout>
    </>
  );
}