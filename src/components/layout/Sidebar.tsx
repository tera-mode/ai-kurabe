'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface SidebarMenuItem {
  icon: string;
  label: string;
  path: string;
  divider?: boolean;
}

const sidebarMenuItems: SidebarMenuItem[] = [
  { icon: '⚖️', label: 'テキスト比較', path: '/' },
  { icon: '🖼️', label: '画像生成比較', path: '/image' },
  { divider: true, icon: '', label: '', path: '' },
  { icon: '👤', label: 'アカウント', path: '/account' },
  { icon: '💰', label: '価格', path: '/pricing' },
  { icon: '⚙️', label: '設定', path: '/settings' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-blue-100 via-indigo-100 to-purple-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full">
      {/* ロゴ・ブランド */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            AIくらべ
          </h1>
        </Link>
      </div>

      {/* ナビゲーションメニュー */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {sidebarMenuItems.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-4 h-px bg-slate-200 dark:bg-slate-700"
                />
              );
            }

            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ユーザー情報とダイヤ表示 */}
      {user && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          {/* ユーザー基本情報 */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {user.membershipType === 'free' ? '無料プラン' : '有料プラン'}
                </p>
              </div>
            </div>
          </div>

          {/* ダイヤ表示 */}
          {user.membershipType === 'paid' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">💎</span>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {(user.diamonds || 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* 無料プランの次回利用可能日 */}
          {user.membershipType === 'free' && user.lastUsed && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
              <div className="text-center">
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                  次回利用可能
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  {(() => {
                    const nextUse = new Date(new Date(user.lastUsed).getTime() + (7 * 24 * 60 * 60 * 1000));
                    const now = new Date();
                    if (nextUse <= now) return '利用可能';
                    return nextUse.toLocaleDateString('ja-JP');
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}