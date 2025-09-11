'use client';

import { useState } from 'react';
import FourPanelLayout from '@/components/FourPanelLayout';
import UnifiedInput from '@/components/UnifiedInput';
import { AIModel, Message } from '@/types';

// Mock data for development
const mockModels: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    costPerToken: 0.03,
    maxTokens: 8192,
    isActive: true,
    displayOrder: 1
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: 0.025,
    maxTokens: 4096,
    isActive: true,
    displayOrder: 2
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    costPerToken: 0.02,
    maxTokens: 2048,
    isActive: true,
    displayOrder: 3
  }
];

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<(AIModel | null)[]>([
    mockModels[0], // GPT-4
    mockModels[1], // Claude 3
    mockModels[2], // Gemini Pro
    null
  ]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleModelSelect = (panelIndex: number, modelId: string | null) => {
    const model = modelId ? mockModels.find(m => m.id === modelId) || null : null;
    setSelectedModels(prev => {
      const updated = [...prev];
      updated[panelIndex] = model;
      return updated;
    });
  };

  const activeModels = selectedModels.filter(model => model !== null) as AIModel[];
  const activeModelCount = activeModels.length;

  const handleSendToModels = async (content: string) => {
    if (activeModelCount === 0) return;

    setIsLoading(true);
    
    // Add user message to all active models
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    const updatedMessages = { ...messages };
    activeModels.forEach(model => {
      if (!updatedMessages[model.id]) {
        updatedMessages[model.id] = [];
      }
      updatedMessages[model.id] = [...updatedMessages[model.id], userMessage];
    });
    setMessages(updatedMessages);

    // Call AI APIs
    const promises = activeModels.map(async (model) => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            modelId: model.id
          })
        });

        const data = await response.json();
        
        const aiMessage: Message = {
          id: `${Date.now()}-${model.id}-${Math.random()}`,
          content: data.error ? `エラー: ${data.error}` : data.content,
          role: 'assistant',
          timestamp: new Date(),
          modelId: model.id
        };

        setMessages(prev => ({
          ...prev,
          [model.id]: [...(prev[model.id] || []), aiMessage]
        }));
      } catch (error) {
        const errorMessage: Message = {
          id: `${Date.now()}-${model.id}-error`,
          content: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
          role: 'assistant',
          timestamp: new Date(),
          modelId: model.id
        };

        setMessages(prev => ({
          ...prev,
          [model.id]: [...(prev[model.id] || []), errorMessage]
        }));
      }
    });

    // Wait for all API calls to complete
    await Promise.all(promises);
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-white p-4">
        <h1 className="text-2xl font-bold text-gray-800">AIくらべ</h1>
        <p className="text-sm text-gray-600">4つのパネルで複数のAIモデルを同時に比較</p>
      </header>
      
      <FourPanelLayout
        models={mockModels}
        selectedModels={selectedModels}
        messages={messages}
        onModelSelect={handleModelSelect}
      />
      
      <UnifiedInput
        onSend={handleSendToModels}
        disabled={isLoading}
        activeModelCount={activeModelCount}
      />
    </div>
  );
}
