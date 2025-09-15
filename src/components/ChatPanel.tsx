'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevHadStreaming = useRef(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userScrolling, setUserScrolling] = useState(false);

  // デバッグ用パネル識別
  const panelId = `panel-${panelIndex}-${selectedModel?.id || 'no-model'}`;

  // スクロールが最下部にあるかチェック
  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 50; // 50pxのマージンを許容
  };

  // メッセージが更新された時の自動スクロール
  useEffect(() => {
    if (autoScroll && !userScrolling) {
      // ストリーミング中は即座にスクロール、完了時はスムーズにスクロール
      const hasStreamingMessage = messages.some(msg => msg.isStreaming);
      console.log(`[${panelId}] Auto-scroll triggered. Streaming: ${hasStreamingMessage}, Messages: ${messages.length}`);

      if (hasStreamingMessage) {
        // ストリーミング中は小さな遅延でスクロール
        const timer = setTimeout(() => {
          if (messagesEndRef.current && autoScroll && !userScrolling) {
            console.log(`[${panelId}] Scrolling during streaming`);
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
          }
        }, 50);
        return () => clearTimeout(timer);
      } else if (messagesEndRef.current && messages.length > 0) {
        console.log(`[${panelId}] Smooth scrolling after streaming complete`);
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, autoScroll, userScrolling, panelId]);

  // ストリーミング開始時に状態をリセット
  useEffect(() => {
    const hasStreamingMessage = messages.some(msg => msg.isStreaming);

    // 新しいストリーミングが開始された場合、状態をリセット
    if (hasStreamingMessage) {
      console.log(`[${panelId}] Streaming started, resetting scroll state`);
      setUserScrolling(false);
      setAutoScroll(true);
    }
  }, [messages, panelId]);

  // 新しい会話開始時の状態リセット
  useEffect(() => {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const lastMessage = messages[messages.length - 1];

    // 新しいユーザーメッセージが追加された場合、または新しいアシスタントメッセージが開始された場合
    if ((lastMessage?.role === 'user') ||
        (lastMessage?.role === 'assistant' && lastMessage.isStreaming)) {
      console.log(`[${panelId}] New conversation or streaming started, enabling auto-scroll`);
      setUserScrolling(false);
      setAutoScroll(true);
    }
  }, [messages.length, panelId]);

  // ストリーミング完了時の処理
  useEffect(() => {
    const hasStreamingMessage = messages.some(msg => msg.isStreaming);

    // ストリーミングが完了した時
    if (prevHadStreaming.current && !hasStreamingMessage) {
      console.log(`[${panelId}] Streaming completed`);
      // 最下部にいる場合は次回の準備として自動スクロールを有効にしておく
      if (isAtBottom()) {
        setUserScrolling(false);
        setAutoScroll(true);
      }
    }

    prevHadStreaming.current = hasStreamingMessage;
  }, [messages, panelId, isAtBottom]);

  // ユーザーのスクロール操作を検知
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const isBottom = isAtBottom();

    // 自動スクロール中でない場合のみユーザー操作として扱う
    requestAnimationFrame(() => {
      if (!isBottom && !userScrolling) {
        // ユーザーが上にスクロールした場合、自動スクロールを無効化
        console.log(`[${panelId}] User scrolled up, disabling auto-scroll`);
        setUserScrolling(true);
        setAutoScroll(false);
      } else if (isBottom && userScrolling) {
        // ユーザーが最下部に戻った場合、自動スクロールを再有効化
        console.log(`[${panelId}] User scrolled back to bottom, enabling auto-scroll`);
        setUserScrolling(false);
        setAutoScroll(true);
      }
    });
  };

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
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 md:p-6 min-h-0"
      >
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
                <div className="text-sm md:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="prose-ai">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
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
            {/* スクロール用の非表示要素 */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
}