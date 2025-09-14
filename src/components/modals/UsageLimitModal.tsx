'use client';

import { UsageLimit, PRICING } from '@/types';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageLimit: UsageLimit;
}

export default function UsageLimitModal({ isOpen, onClose, usageLimit }: UsageLimitModalProps) {
  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpgrade = () => {
    // 価格ページに遷移
    window.location.href = '/pricing';
  };

  const renderFreeUserLimit = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        無料プランの利用制限
      </h3>

      <p className="text-slate-600 dark:text-slate-400 mb-4">
        無料プランでは{PRICING.FREE_USER_COOLDOWN_DAYS}日間に1回のみご利用いただけます
      </p>

      {usageLimit.nextAvailableDate && (
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">次回ご利用可能日時</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {formatDate(usageLimit.nextAvailableDate)}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleUpgrade}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
        >
          従量課金プランにアップグレード
        </button>

        <button
          onClick={onClose}
          className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-lg transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );

  const renderInsufficientDiamonds = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        ダイヤが不足しています
      </h3>

      <p className="text-slate-600 dark:text-slate-400 mb-4">
        この操作には{usageLimit.requiredDiamonds}ダイヤが必要です
      </p>

      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400">必要ダイヤ</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {usageLimit.requiredDiamonds}ダイヤ
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleUpgrade}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
        >
          ダイヤを購入する
        </button>

        <button
          onClick={onClose}
          className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-lg transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-xl p-6 md:p-8 w-full max-w-md mx-auto"
        onClick={handleModalClick}
      >
        {usageLimit.reason === 'free_limit' && renderFreeUserLimit()}
        {usageLimit.reason === 'insufficient_diamonds' && renderInsufficientDiamonds()}
      </div>
    </div>
  );
}