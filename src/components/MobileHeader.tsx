'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileHeader() {
  const pathname = usePathname();

  return (
    // グローバルスタイル準拠: ヘッダー高さ・パディング統一
    <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2 fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
      <div className="flex items-center justify-between h-full">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">AIくらべ</h1>
        <div className="flex space-x-2">
          <Link href="/">
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${
                pathname === '/'
                  ? 'bg-blue-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105'
              }`}
            >
              💬 テキスト
            </button>
          </Link>
          <Link href="/image">
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${
                pathname === '/image'
                  ? 'bg-blue-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105'
              }`}
            >
              🎨 画像
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}