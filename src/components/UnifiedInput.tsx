'use client';

import { useState } from 'react';
import BaseInputArea from './BaseInputArea';

interface UnifiedInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  activeModelCount?: number;
}

export default function UnifiedInput({ onSend, disabled = false, activeModelCount = 0 }: UnifiedInputProps) {
  const [message, setMessage] = useState('');
  const [showSamples, setShowSamples] = useState(false);

  const samplePrompts = [
    "JavaScript でソートアルゴリズムを実装する方法を教えて",
    "React のuseEffectフックの使い方を詳しく説明して",
    "データベース設計の基本原則について教えて",
    "機械学習の基礎概念をわかりやすく説明して",
    "Pythonでウェブスクレイピングをする方法は？",
    "APIの設計原則とベストプラクティスを教えて"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleSampleSelect = (sampleText: string) => {
    setMessage(sampleText);
    setShowSamples(false);
  };

  return (
    <BaseInputArea showGuide={activeModelCount === 0}>
      <form onSubmit={handleSubmit}>
        {/* グローバルスタイル準拠: ギャップ統一 */}
        <div className="flex gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={activeModelCount > 0 ?
                  `質問を入力（${activeModelCount}モデル送信）` :
                  "モデルを選択"
                }
                // グローバルスタイル準拠: 入力エリア高さ・角丸・パディング統一
                className="w-full resize-none border-2 border-white/20 bg-white rounded-2xl md:rounded-xl px-4 py-3 pr-14 pb-8 md:px-6 md:py-4 md:pr-20 md:pb-12 text-sm md:text-base text-slate-900
                  focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-white/20
                  placeholder:text-slate-500 transition-all duration-200 shadow-xl
                  disabled:bg-slate-100 disabled:cursor-not-allowed backdrop-blur-sm h-[70px] md:h-[120px]"
                rows={3}
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              {/* 質問例ボタン - テキストエリア内の右下 */}
              <button
                type="button"
                onClick={() => setShowSamples(!showSamples)}
                className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white
                  px-3 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg active:shadow-sm
                  transition-all duration-150 border border-blue-400 hover:border-blue-500
                  disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none
                  transform hover:scale-105 active:scale-95 touch-manipulation"
                disabled={disabled}
                title="よく使われる質問例を見る"
              >
                💡<span className="hidden sm:inline"> 質問例</span>
              </button>

              {/* サンプル一覧 - テキストエリア直上 */}
              {showSamples && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-blue-300 
                  rounded-xl shadow-2xl p-4 z-20 max-h-64 overflow-y-auto animate-fadeIn">
                  <div className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    よく使われる質問をクリックして試してみましょう！
                  </div>
                  <div className="grid gap-2">
                    {samplePrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSampleSelect(prompt)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50
                          hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 
                          border border-blue-200 hover:border-blue-300 hover:shadow-md transform hover:scale-[1.02]
                          hover:text-blue-800 font-medium"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200 text-center">
                    <button
                      onClick={() => setShowSamples(false)}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium
                        px-3 py-1 rounded-md hover:bg-blue-50"
                    >
                      ✕ 閉じる
                    </button>
                  </div>
                </div>
              )}
              {disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-xl">
                  <div className="flex items-center gap-2 text-white">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">AI応答生成中...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={disabled || !message.trim() || activeModelCount === 0}
            // グローバルスタイル準拠: ボタン高さ・角丸・カラー統一
            className="px-4 md:px-8 h-[70px] md:h-[120px] bg-gradient-to-r from-white to-blue-50 text-slate-800 text-sm md:text-base font-bold touch-manipulation
              rounded-2xl md:rounded-xl border-2 border-white/50 hover:from-blue-50 hover:to-white hover:border-white
              disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 disabled:border-slate-600
              transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105
              disabled:transform-none disabled:shadow-md min-w-[70px] md:min-w-[120px] backdrop-blur-sm"
          >
            {disabled ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                送信中
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                送信する
              </div>
            )}
          </button>
        </div>
      </form>

    </BaseInputArea>
  );
}