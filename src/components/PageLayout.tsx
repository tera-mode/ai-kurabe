'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  currentPage: 'text' | 'image';
}

export default function PageLayout({ children, title, subtitle, currentPage }: PageLayoutProps) {

  return (
    <div className="h-screen flex overflow-hidden pt-14 md:pt-0" style={{height: '100dvh'}}>
      {/* PC版サイドバー */}
      <Sidebar />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* PC版ヘッダー */}
        <header className="hidden md:block border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {currentPage === 'text' ? 'テキストAI比較' : currentPage === 'image' ? '画像生成AI比較' : title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* PC版ナビゲーションリンク（サイドバーと重複するが残す） */}
              <nav className="flex gap-4">
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentPage === 'text'
                      ? 'text-slate-900 dark:text-slate-100 border-b-2 border-blue-600'
                      : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                  }`}
                >
                  テキストAI比較
                </Link>
                <Link
                  href="/image"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentPage === 'image'
                      ? 'text-slate-900 dark:text-slate-100 border-b-2 border-blue-600'
                      : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                  }`}
                >
                  画像生成AI比較
                </Link>
              </nav>

            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}