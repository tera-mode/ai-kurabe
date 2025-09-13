'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileHeader() {
  const pathname = usePathname();

  return (
    <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-1.5 sticky top-0 z-50 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">AIくらべ</h1>
        <div className="flex space-x-1">
          <Link href="/">
            <button 
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                pathname === '/' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              💬 テキスト
            </button>
          </Link>
          <Link href="/image">
            <button 
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                pathname === '/image' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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