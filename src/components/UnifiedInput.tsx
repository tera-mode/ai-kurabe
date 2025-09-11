'use client';

import { useState } from 'react';

interface UnifiedInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  activeModelCount?: number;
}

export default function UnifiedInput({ onSend, disabled = false, activeModelCount = 0 }: UnifiedInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={activeModelCount > 0 ? `${activeModelCount}つのモデルに同時送信...` : "モデルを選択してプロンプトを入力してください..."}
            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {activeModelCount > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              選択中: {activeModelCount}つのモデル | Shift+Enterで改行
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !message.trim() || activeModelCount === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[80px]"
        >
          {disabled ? '送信中...' : '送信'}
        </button>
      </div>
    </form>
  );
}