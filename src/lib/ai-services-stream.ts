import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface StreamChunk {
  content: string;
  model: string;
  type: 'chunk' | 'complete' | 'error';
  tokens?: number;
  error?: string;
}

function sendSSEMessage(controller: ReadableStreamDefaultController, data: StreamChunk) {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
  );
}

export async function callClaudeStream(
  message: string,
  modelId: string,
  controller: ReadableStreamDefaultController
) {
  const modelDisplayNames: Record<string, string> = {
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet (Latest)',
    'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet (June)',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
  };

  try {
    const stream = await anthropic.messages.create({
      model: modelId,
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: message
      }],
      stream: true,
    });

    let fullContent = '';
    let totalTokens = 0;

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        if (chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullContent += text;

          // Send each character chunk for typing animation
          sendSSEMessage(controller, {
            content: text,
            model: modelDisplayNames[modelId] || modelId,
            type: 'chunk'
          });

          // Small delay for typing effect
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      } else if (chunk.type === 'message_delta') {
        if (chunk.usage) {
          totalTokens = chunk.usage.output_tokens || 0;
        }
      }
    }

    // Send completion message
    sendSSEMessage(controller, {
      content: fullContent,
      model: modelDisplayNames[modelId] || modelId,
      type: 'complete',
      tokens: totalTokens
    });

  } catch (error) {
    console.error('Claude Stream Error:', error);

    // Fallback to non-streaming API if streaming fails
    try {
      console.log('Attempting fallback to non-streaming Claude API...');
      const response = await anthropic.messages.create({
        model: modelId,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: message
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Simulate typing animation for fallback
        const text = content.text;
        let currentText = '';

        for (let i = 0; i < text.length; i++) {
          currentText += text[i];
          sendSSEMessage(controller, {
            content: text[i],
            model: modelDisplayNames[modelId] || modelId,
            type: 'chunk'
          });

          // Faster typing for fallback
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        sendSSEMessage(controller, {
          content: text,
          model: modelDisplayNames[modelId] || modelId,
          type: 'complete',
          tokens: response.usage.output_tokens
        });
      }
    } catch (fallbackError) {
      console.error('Claude Fallback Error:', fallbackError);
      sendSSEMessage(controller, {
        content: 'エラーが発生しました。Claude APIの呼び出しに失敗しました。',
        model: modelDisplayNames[modelId] || modelId,
        type: 'error',
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      });
    }
  }
}

export async function callGeminiStream(
  message: string,
  modelId: string,
  controller: ReadableStreamDefaultController
) {
  const actualModelId = modelId === 'gemini-pro' ? 'gemini-1.5-flash' : modelId;
  const displayModel = modelId === 'gemini-pro' ? 'Gemini Pro (Flash)' : modelId;

  try {
    const model = genAI.getGenerativeModel({ model: actualModelId });
    const result = await model.generateContentStream(message);
    let fullContent = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullContent += chunkText;

      // Send each chunk for typing animation
      sendSSEMessage(controller, {
        content: chunkText,
        model: displayModel,
        type: 'chunk'
      });

      // Small delay for typing effect
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Send completion message
    sendSSEMessage(controller, {
      content: fullContent,
      model: displayModel,
      type: 'complete'
    });

  } catch (error) {
    console.error('Gemini Stream Error:', error);

    // Handle rate limiting first
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('quota'))) {
      sendSSEMessage(controller, {
        content: '⚠️ Gemini APIの利用制限に達しました。しばらく待ってから再試行してください。\n\n無料プランの制限:\n- 1分間: 15回\n- 1日: 1500回\n\n有料プランにアップグレードすると制限が緩和されます。',
        model: displayModel,
        type: 'error',
        error: 'Rate limit exceeded'
      });
      return;
    }

    // Fallback to non-streaming API if streaming fails
    try {
      console.log('Attempting fallback to non-streaming Gemini API...');
      const model = genAI.getGenerativeModel({ model: actualModelId });
      const result = await model.generateContent(message);
      const response = await result.response;
      const text = response.text();

      // Simulate typing animation for fallback
      for (let i = 0; i < text.length; i++) {
        sendSSEMessage(controller, {
          content: text[i],
          model: displayModel,
          type: 'chunk'
        });

        // Faster typing for fallback
        await new Promise(resolve => setTimeout(resolve, 15));
      }

      sendSSEMessage(controller, {
        content: text,
        model: displayModel,
        type: 'complete'
      });

    } catch (fallbackError) {
      console.error('Gemini Fallback Error:', fallbackError);
      sendSSEMessage(controller, {
        content: 'エラーが発生しました。Gemini APIの呼び出しに失敗しました。',
        model: displayModel,
        type: 'error',
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      });
    }
  }
}

export async function callMockAIStream(
  message: string,
  modelName: string,
  controller: ReadableStreamDefaultController
) {
  const mockResponse = `これは${modelName}からの模擬応答です。実際のAPI統合が必要です。\n\nあなたのメッセージ: "${message}"\n\nこのテキストは文字ごとに表示されるタイピングアニメーションのデモンストレーションです。`;

  // Simulate typing animation character by character
  let currentContent = '';
  for (let i = 0; i < mockResponse.length; i++) {
    currentContent += mockResponse[i];

    sendSSEMessage(controller, {
      content: mockResponse[i],
      model: modelName,
      type: 'chunk'
    });

    // Vary delay for more realistic typing
    const delay = mockResponse[i] === ' ' ? 50 :
                 mockResponse[i] === '。' || mockResponse[i] === '\n' ? 200 :
                 Math.random() * 80 + 20;

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Send completion message
  sendSSEMessage(controller, {
    content: mockResponse,
    model: modelName,
    type: 'complete'
  });
}