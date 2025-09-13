'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  currentPage: 'text' | 'image';
}

export default function PageLayout({ children, title, subtitle, currentPage }: PageLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden pt-14 md:pt-0" style={{height: '100dvh'}}>
      <header className="hidden md:block border-b bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors duration-200 ${
                currentPage === 'text'
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-blue-600'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
              }`}
            >
              テキストAI比較
            </Link>
            <Link
              href="/image"
              className={`text-sm font-medium transition-colors duration-200 ${
                currentPage === 'image'
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-blue-600'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
              }`}
            >
              画像生成AI比較
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}