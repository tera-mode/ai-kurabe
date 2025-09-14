'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MobileMenuItem {
  icon: string;
  label: string;
  path: string;
  divider?: boolean;
}

const mobileMenuItems: MobileMenuItem[] = [
  { icon: '🤖', label: 'テキスト比較', path: '/' },
  { icon: '🎨', label: '画像生成比較', path: '/image' },
  { divider: true } as any,
  { icon: '👤', label: 'アカウント', path: '/account' },
  { icon: '💰', label: '価格', path: '/pricing' },
  { icon: '⚙️', label: '設定', path: '/settings' }
];

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!isOpen) return null;

  const handleLinkClick = () => {
    onClose();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* メニューパネル */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-800 shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                AIくらべ
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ナビゲーションメニュー */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {mobileMenuItems.map((item, index) => {
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
                    onClick={handleLinkClick}
                    className={`
                      w-full flex items-center gap-4 px-4 py-4 rounded-lg text-left transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-base">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ユーザー情報 */}
          {user && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {user.displayName || user.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {user.membershipType === 'free' ? '無料プラン' : '有料プラン'}
                      </p>
                      {user.membershipType === 'paid' && (
                        <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                          <span>💎</span>
                          <span>{user.diamonds?.toLocaleString() || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}