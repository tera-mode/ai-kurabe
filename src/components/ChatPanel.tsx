'use client';

import { AIModel } from '@/types';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  tokens?: number;
  isStreaming?: boolean;
  error?: string;
}

interface ChatPanelProps {
  panelIndex: number;
  selectedModel: AIModel | null;
  models: AIModel[];
  messages: Message[];
  onModelSelect: (modelId: string | null) => void;
}

export default function ChatPanel({
  panelIndex,
  selectedModel,
  models,
  messages,
  onModelSelect
}: ChatPanelProps) {
  return (
    // グローバルスタイル準拠: パネル境界線・角丸統一
    <div className="flex flex-col h-full border border-slate-200 dark:border-slate-600 md:border-2 md:border-slate-300 dark:md:border-slate-600 shadow-sm hover:shadow-md transition-shadow border-b-2 border-slate-200 dark:border-slate-700 md:border-b-0 overflow-hidden bg-white dark:bg-slate-800 rounded-none md:rounded-lg">
      {/* Header with model selector - グローバルスタイル準拠: パディング統一 */}
      <div className="p-4 md:px-6 md:py-4 border-b bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => onModelSelect(e.target.value || null)}
          className="w-full p-3 md:p-2 border border-gray-300 dark:border-slate-500 rounded-lg md:rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm"
        >
          <option value="">モデルを選択</option>
          {models
            .filter(model => model.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
        </select>
        {selectedModel && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
            ¥{selectedModel.costPerToken}/token
          </div>
        )}
      </div>
      
      {/* Messages area - グローバルスタイル準拠: パディング・スペーシング統一 */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 min-h-0">
        {!selectedModel ? (
          <div className="text-gray-500 dark:text-gray-400 text-center text-sm h-full flex items-center justify-center">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 mx-4">
              モデルを選択してください
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center text-sm h-full flex items-center justify-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mx-4 border border-blue-200 dark:border-blue-800">
              プロンプトを入力してください
            </div>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 md:p-4 rounded-xl ${
                  message.role === 'user'
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 ml-2 md:ml-4'
                    : 'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 mr-2 md:mr-4'
                }`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                  {message.role === 'user' ? 'あなた' : selectedModel.name}
                </div>
                <div className="text-sm md:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                  {message.isStreaming && (
                    <span className="animate-pulse text-blue-500 ml-1">▋</span>
                  )}
                </div>
                {message.tokens && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {message.tokens} tokens
                  </div>
                )}
                {message.error && (
                  <div className="text-xs text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    エラー: {message.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}