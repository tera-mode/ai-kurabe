'use client';

import { useState, useEffect, useRef } from 'react';
import PageLayout from '@/components/PageLayout';
import FourPanelLayout from '@/components/FourPanelLayout';
import UnifiedInput from '@/components/UnifiedInput';
import MobileHeader from '@/components/MobileHeader';
import { AIModel } from '@/types';

interface StreamMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  tokens?: number;
  isStreaming?: boolean;
  error?: string;
}

// Mock data for development
const mockModels: AIModel[] = [
  // OpenAI Models
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
  // Claude Models - All available models
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet (Latest)',
    provider: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: 0.015,
    maxTokens: 8192,
    isActive: true,
    displayOrder: 2
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet (June)',
    provider: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: 0.015,
    maxTokens: 8192,
    isActive: true,
    displayOrder: 3
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: 0.001,
    maxTokens: 8192,
    isActive: true,
    displayOrder: 4
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: 0.075,
    maxTokens: 4096,
    isActive: true,
    displayOrder: 5
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: 0.015,
    maxTokens: 4096,
    isActive: true,
    displayOrder: 6
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: 0.00125,
    maxTokens: 4096,
    isActive: true,
    displayOrder: 7
  },
  // Google Models
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    costPerToken: 0.02,
    maxTokens: 2048,
    isActive: true,
    displayOrder: 8
  }
];

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<(AIModel | null)[]>([
    mockModels[1], // Claude 3.5 Sonnet (Latest) - モバイルでも表示
    mockModels[4], // Claude 3 Opus - モバイルでも表示
    mockModels[0], // GPT-4 - デスクトップのみ
    mockModels[7]  // Gemini Pro - デスクトップのみ
  ]);
  const [messages, setMessages] = useState<Record<string, StreamMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const handleModelSelect = (panelIndex: number, modelId: string | null) => {
    const model = modelId ? mockModels.find(m => m.id === modelId) || null : null;
    setSelectedModels(prev => {
      const updated = [...prev];
      updated[panelIndex] = model;
      return updated;
    });
  };

  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate active models based on screen size
  const visibleModels = !isMounted || isMobile ? selectedModels.slice(0, 2) : selectedModels;
  const activeModels = visibleModels.filter(model => model !== null) as AIModel[];
  const activeModelCount = activeModels.length;

  const handleSendToModels = async (content: string) => {
    if (activeModelCount === 0) return;

    // Stop any ongoing streams
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();

    setIsLoading(true);

    // Add user message to all active models
    const userMessage: StreamMessage = {
      id: Date.now().toString(),
      content,
      role: 'user'
    };

    const updatedMessages = { ...messages };
    activeModels.forEach(model => {
      if (!updatedMessages[model.id]) {
        updatedMessages[model.id] = [];
      }
      updatedMessages[model.id] = [...updatedMessages[model.id], userMessage];
    });
    setMessages(updatedMessages);

    // Stream AI responses in parallel
    const streamPromises = activeModels.map(async (model) => {
      const abortController = new AbortController();
      abortControllersRef.current.set(model.id, abortController);

      try {
        // Add assistant message placeholder
        const assistantMessageId = `${Date.now()}-${model.id}-${Math.random()}`;
        const assistantMessage: StreamMessage = {
          id: assistantMessageId,
          content: '',
          role: 'assistant',
          isStreaming: true,
          model: model.name
        };

        setMessages(prev => ({
          ...prev,
          [model.id]: [...(prev[model.id] || []), assistantMessage]
        }));

        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            modelId: model.id
          }),
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Stream not supported');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'chunk') {
                  // Append chunk to assistant message
                  setMessages(prev => ({
                    ...prev,
                    [model.id]: prev[model.id].map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  }));
                } else if (data.type === 'complete') {
                  // Mark as complete
                  setMessages(prev => ({
                    ...prev,
                    [model.id]: prev[model.id].map(msg =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            isStreaming: false,
                            model: data.model,
                            tokens: data.tokens
                          }
                        : msg
                    )
                  }));
                } else if (data.type === 'error') {
                  // Handle error
                  setMessages(prev => ({
                    ...prev,
                    [model.id]: prev[model.id].map(msg =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: data.content,
                            isStreaming: false,
                            error: data.error,
                            model: data.model
                          }
                        : msg
                    )
                  }));
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
              }
            }
          }
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted - don't show error
          return;
        }

        console.error(`Streaming error for ${model.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Find and update the assistant message with error
        setMessages(prev => ({
          ...prev,
          [model.id]: prev[model.id].map(msg =>
            msg.role === 'assistant' && msg.isStreaming
              ? {
                  ...msg,
                  content: 'エラーが発生しました。再試行してください。',
                  isStreaming: false,
                  error: errorMessage
                }
              : msg
          )
        }));
      } finally {
        abortControllersRef.current.delete(model.id);
      }
    });

    // Wait for all streams to complete
    await Promise.all(streamPromises);
    setIsLoading(false);
  };

  return (
    <>
      <MobileHeader />
      <PageLayout
        title="AIくらべ"
        subtitle="複数のAIモデルを同時に比較"
        currentPage="text"
      >
        <div className="flex-1 min-h-0">
          <FourPanelLayout
            models={mockModels}
            selectedModels={selectedModels}
            messages={messages}
            onModelSelect={handleModelSelect}
          />
        </div>
        
        <div className="flex-shrink-0">
          <UnifiedInput
            onSend={handleSendToModels}
            disabled={isLoading}
            activeModelCount={activeModelCount}
          />
        </div>
      </PageLayout>
    </>
  );
}