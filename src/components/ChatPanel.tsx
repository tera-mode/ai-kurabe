'use client';

import { AIModel, Message } from '@/types';

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
    <div className="flex flex-col h-full border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow border-b-2 border-slate-200 dark:border-slate-700 md:border-b-0 overflow-hidden bg-white dark:bg-slate-800">
      {/* Header with model selector */}
      <div className="p-3 md:px-6 md:py-4 border-b bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => onModelSelect(e.target.value || null)}
          className="w-full p-2 border border-gray-300 dark:border-slate-500 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-600 text-gray-900 dark:text-gray-100"
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
          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            ¥{selectedModel.costPerToken}/token
          </div>
        )}
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:px-6 md:py-4 min-h-0">
        {!selectedModel ? (
          <div className="text-gray-500 dark:text-gray-400 text-center text-sm h-full flex items-center justify-center">
            モデルを選択してください
          </div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center text-sm h-full flex items-center justify-center">
            プロンプトを入力してください
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600'
                }`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                  {message.role === 'user' ? 'あなた' : selectedModel.name}
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}