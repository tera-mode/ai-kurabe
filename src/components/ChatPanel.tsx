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
    <div className="flex flex-col h-full border border-gray-200">
      {/* Header with model selector */}
      <div className="p-3 border-b bg-gray-50">
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => onModelSelect(e.target.value || null)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="text-xs text-gray-500 mt-1">
            ¥{selectedModel.costPerToken}/token
          </div>
        )}
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedModel ? (
          <div className="text-gray-500 text-center text-sm">
            モデルを選択してください
          </div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 text-center text-sm">
            プロンプトを入力してください
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  {message.role === 'user' ? 'あなた' : selectedModel.name}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
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