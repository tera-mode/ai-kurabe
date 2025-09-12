'use client';

import { useState, FormEvent } from 'react';

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && activeModelCount > 0 && !disabled) {
      onGenerate(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="画像生成のプロンプトを入力..."
            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={disabled}
          />
          <div className="text-xs text-gray-500 mt-1">
            選択中: {activeModelCount}つのモデル | Shift+Enterで改行 | 自動プロンプト変換機能付き
          </div>
        </div>
        <button
          type="submit"
          disabled={disabled || !prompt.trim() || activeModelCount === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[80px]"
        >
          {disabled ? '生成中...' : '生成'}
        </button>
      </div>
    </form>
  );
}