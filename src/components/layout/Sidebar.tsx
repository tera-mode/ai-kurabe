'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import LoginModal from '@/components/auth/LoginModal';

interface SidebarMenuItem {
  icon: string;
  label: string;
  path: string;
  divider?: boolean;
  onClick?: () => void;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const loggedInMenuItems: SidebarMenuItem[] = [
    { icon: '⚖️', label: 'テキスト比較', path: '/' },
    { icon: '🖼️', label: '画像生成比較', path: '/image' },
    { divider: true, icon: '', label: '', path: '' },
    { icon: '👤', label: 'アカウント', path: '/account' },
    { icon: '💰', label: '価格', path: '/pricing' },
    { icon: '⚙️', label: '設定', path: '/settings' }
  ];

  const guestMenuItems: SidebarMenuItem[] = [
    { icon: '⚖️', label: 'テキスト比較', path: '/' },
    { icon: '🖼️', label: '画像生成比較', path: '/image' },
    { divider: true, icon: '', label: '', path: '' },
    { icon: '🔑', label: 'ログイン', path: '#', onClick: () => setShowLoginModal(true) },
    { icon: '📝', label: '新規登録', path: '#', onClick: () => setShowLoginModal(true) },
    { icon: '💰', label: '価格', path: '/pricing' }
  ];

  const menuItems = user ? loggedInMenuItems : guestMenuItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-blue-100 via-indigo-100 to-purple-100 dark:bg-slate-900 dark:bg-none border-r border-slate-200 dark:border-slate-700 h-full">
      {/* ロゴ・ブランド */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <Link href="/" className="flex justify-center">
          <img
            src="/image/aikurabe_logo.png"
            alt="AIくらべ ロゴ"
            className="h-10 w-auto object-contain dark:hidden"
          />
          <img
            src="/image/aikurabe_logo_white.png"
            alt="AIくらべ ロゴ"
            className="h-10 w-auto object-contain hidden dark:block"
          />
        </Link>
      </div>

      {/* ナビゲーションメニュー */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-4 h-px bg-slate-200 dark:bg-slate-700"
                />
              );
            }

            const isActive = pathname === item.path;

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200
                    text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            }

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
              </div>
            </div>
          </div>

          {/* ダイヤ表示 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">💎</span>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {(user.diamonds || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ログインモーダル */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        canClose={true}
      />
    </aside>
  );
}