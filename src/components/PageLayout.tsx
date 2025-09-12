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
    <div className="h-screen flex flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
          <nav className="flex gap-4">
            <Link 
              href="/" 
              className={`text-sm font-medium ${
                currentPage === 'text' 
                  ? 'text-gray-900 border-b-2 border-blue-600' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              テキストAI比較
            </Link>
            <Link 
              href="/image" 
              className={`text-sm font-medium ${
                currentPage === 'image' 
                  ? 'text-gray-900 border-b-2 border-blue-600' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              画像生成AI比較
            </Link>
          </nav>
        </div>
      </header>
      
      {children}
    </div>
  );
}