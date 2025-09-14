'use client';

import { useEffect } from 'react';

interface InsufficientDiamondsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredDiamonds: number;
  currentDiamonds: number;
  modelName: string;
  actionType: 'text' | 'image';
}

export default function InsufficientDiamondsModal({
  isOpen,
  onClose,
  requiredDiamonds,
  currentDiamonds,
  modelName,
  actionType
}: InsufficientDiamondsModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortfallDiamonds = requiredDiamonds - currentDiamonds;
  const shortfallYen = Math.ceil(shortfallDiamonds / 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💎</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            ダイヤが不足しています
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {actionType === 'text' ? 'テキスト生成' : '画像生成'}を実行するには追加のダイヤが必要です
          </p>
        </div>

        {/* 詳細情報 */}
        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">使用モデル:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{modelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">必要ダイヤ:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{requiredDiamonds.toLocaleString()}ダイヤ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">現在の残高:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{currentDiamonds.toLocaleString()}ダイヤ</span>
              </div>
              <hr className="border-slate-200 dark:border-slate-600" />
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">不足分:</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {shortfallDiamonds.toLocaleString()}ダイヤ (≈¥{shortfallYen})
                </span>
              </div>
            </div>
          </div>

          {/* 提案 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 mt-0.5">💡</div>
              <div className="text-sm">
                <div className="font-medium text-blue-800 dark:text-blue-400 mb-1">
                  解決方法
                </div>
                <p className="text-blue-700 dark:text-blue-300">
                  ダイヤを購入するか、コストの低いモデル（Gemini 1.5 Flash）をお試しください。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              window.location.href = '/pricing';
            }}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            ダイヤを購入
          </button>
        </div>
      </div>
    </div>
  );
}