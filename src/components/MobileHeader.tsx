'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileMenu from '@/components/layout/MobileMenu';

export default function MobileHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* グローバルスタイル準拠: ヘッダー高さ・パディング統一 */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2 fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
        <div className="flex items-center justify-between h-full">
          {/* ハンバーガーメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <img
            src="/image/aikurabe_logo.png"
            alt="AIくらべ ロゴ"
            className="h-8 w-auto object-contain dark:hidden"
          />
          <img
            src="/image/aikurabe_logo_white.png"
            alt="AIくらべ ロゴ"
            className="h-8 w-auto object-contain hidden dark:block"
          />

          <div className="flex space-x-1">
            <Link href="/">
              <button
                className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-all touch-manipulation ${
                  pathname === '/'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                💬文章
              </button>
            </Link>
            <Link href="/image">
              <button
                className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-all touch-manipulation ${
                  pathname === '/image'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                🖼️画像
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}