import { useState, useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth';

interface StreamChunk {
  content: string;
  model: string;
  type: 'chunk' | 'complete' | 'error';
  tokens?: number;
  error?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  tokens?: number;
  isStreaming?: boolean;
  error?: string;
}

interface UseStreamingChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, modelId: string) => Promise<void>;
  clearMessages: () => void;
  stopStreaming: () => void;
}

export function useStreamingChat(): UseStreamingChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStreamingIdRef = useRef<string | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    // Mark any streaming messages as complete
    if (currentStreamingIdRef.current) {
      setMessages(prev => prev.map(msg =>
        msg.id === currentStreamingIdRef.current
          ? { ...msg, isStreaming: false }
          : msg
      ));
      currentStreamingIdRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (message: string, modelId: string) => {
    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      content: message,
      role: 'user'
    };

    // Add assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      isStreaming: true,
      model: modelId
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    currentStreamingIdRef.current = assistantMessageId;

    try {
      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Get ID token for authenticated users
      let idToken: string | undefined;
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          idToken = await currentUser.getIdToken();
        }
      } catch (authError) {
        console.log('User not authenticated, continuing without diamond consumption');
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, modelId, idToken }),
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
              const data: StreamChunk = JSON.parse(line.slice(6));

              if (data.type === 'chunk') {
                // Append chunk to assistant message
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ));
              } else if (data.type === 'complete') {
                // Mark as complete
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        isStreaming: false,
                        model: data.model,
                        tokens: data.tokens
                      }
                    : msg
                ));
                currentStreamingIdRef.current = null;
              } else if (data.type === 'error') {
                // Handle error
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: data.content,
                        isStreaming: false,
                        error: data.error,
                        model: data.model
                      }
                    : msg
                ));
                setError(data.error || 'Unknown error occurred');
                currentStreamingIdRef.current = null;
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted - don't show error
        return;
      }

      console.error('Streaming error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      // Update assistant message with error
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: 'エラーが発生しました。再試行してください。',
              isStreaming: false,
              error: errorMessage
            }
          : msg
      ));
      currentStreamingIdRef.current = null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    stopStreaming
  };
}