'use client';

import { useState, FormEvent } from 'react';
import BaseInputArea from './BaseInputArea';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import LoginModal from '@/components/auth/LoginModal';
import UsageLimitModal from '@/components/modals/UsageLimitModal';
import { UsageLimit } from '@/types';

interface ImagePromptInputProps {
  onGenerate: (prompt: string) => void;
  disabled: boolean;
  activeModelCount: number;
}

export default function ImagePromptInput({
  onGenerate,
  disabled,
  activeModelCount
}: ImagePromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showSamples, setShowSamples] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [currentUsageLimit, setCurrentUsageLimit] = useState<UsageLimit | null>(null);

  const { user } = useAuth();
  const { checkUsageLimit, updateUsageForFreeUser } = useUsageLimit();

  const samplePrompts = [
    "美しい夕焼けの海辺、波が砂浜に打ち寄せる風景",
    "サイバーパンクな未来都市の夜景、ネオンライトが反射する雨の道路",
    "魔法の森の中の古い図書館、本から光が溢れる幻想的なシーン",
    "宇宙ステーションから見た地球、星々が輝く無限の宇宙空間",
    "日本の伝統的な庭園、桜の花びらが舞い散る春の午後",
    "スチームパンクなロボットが作業する工場の内部"
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || disabled || activeModelCount === 0) return;

    // 認証チェック
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // 利用制限チェック（画像生成は推定1画像）
    const usageLimit = await checkUsageLimit(undefined, 1);
    if (!usageLimit.canUse) {
      setCurrentUsageLimit(usageLimit);
      setShowUsageLimitModal(true);
      return;
    }

    // 無料ユーザーの場合、最終利用日を更新
    if (user.membershipType === 'free') {
      await updateUsageForFreeUser();
    }

    // 実際の生成処理
    onGenerate(prompt.trim());
    setPrompt('');
  };

  const handleSampleSelect = (sampleText: string) => {
    setPrompt(sampleText);
    setShowSamples(false);
  };

  return (
    <>
    <BaseInputArea 
      showGuide={activeModelCount === 0}
      guideText="上のパネルから画像生成AIモデルを選択して、下の入力欄に画像生成のプロンプトを入力してください"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeModelCount > 0 ? 
                  `画像生成プロンプトを入力 (${activeModelCount}モデル送信)` : 
                  "まずは上のパネルで画像生成AIモデルを選択してください"
                }
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

              {/* 画像例ボタン - テキストエリア内の右下 */}
              <button
                type="button"
                onClick={() => setShowSamples(!showSamples)}
                className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white
                  px-3 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg active:shadow-sm
                  transition-all duration-150 border border-blue-400 hover:border-blue-500
                  disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none
                  transform hover:scale-105 active:scale-95 touch-manipulation"
                disabled={disabled}
                title="人気の画像生成例を見る"
              >
                🎨<span className="hidden sm:inline"> 画像例</span>
              </button>

              {/* サンプル一覧 - テキストエリア直上 */}
              {showSamples && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-blue-300
                  rounded-xl shadow-2xl p-4 z-20 max-h-64 overflow-y-auto animate-fadeIn">
                  <div className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">🎨</span>
                    人気の画像テーマをクリックして試してみましょう！
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
                    <span className="text-sm font-medium">AI画像生成中...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={disabled || !prompt.trim() || activeModelCount === 0}
            className="px-4 md:px-8 h-[70px] md:h-[120px] bg-gradient-to-r from-white to-blue-50 text-slate-800 text-sm md:text-base font-bold touch-manipulation
              rounded-2xl md:rounded-xl border-2 border-white/50 hover:from-blue-50 hover:to-white hover:border-white
              disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 disabled:border-slate-600
              transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105
              disabled:transform-none disabled:shadow-md min-w-[70px] md:min-w-[120px] backdrop-blur-sm"
          >
            {disabled ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                生成中
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                生成する
              </div>
            )}
          </button>
        </div>
      </form>

    </BaseInputArea>
    {/* モーダル */}
    <LoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      canClose={false}
    />
    {currentUsageLimit && (
      <UsageLimitModal
        isOpen={showUsageLimitModal}
        onClose={() => setShowUsageLimitModal(false)}
        usageLimit={currentUsageLimit}
      />
    )}
    </>
  );
}