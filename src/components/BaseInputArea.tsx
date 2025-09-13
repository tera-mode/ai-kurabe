'use client';

import { ReactNode } from 'react';

interface BaseInputAreaProps {
  children: ReactNode;
  showGuide?: boolean;
  guideTitle?: string;
  guideText?: string;
}

export default function BaseInputArea({ 
  children, 
  showGuide = false, 
  guideTitle = "使い方ガイド",
  guideText = "上のパネルからAIモデルを選択して、下の入力欄に質問やプロンプトを入力してください" 
}: BaseInputAreaProps) {
  return (
    <div className="border-t bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-3 md:px-6 md:py-6 shadow-xl">
      {/* 初回ユーザー向けガイド */}
      {showGuide && (
        <div className="mb-2 p-2 md:mb-4 md:p-4 bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-400 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <h3 className="text-xs md:text-sm font-semibold text-white">{guideTitle}</h3>
          </div>
          <p className="text-xs text-blue-100">{guideText}</p>
        </div>
      )}
      
      {children}
    </div>
  );
}