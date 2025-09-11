import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIResponse {
  content: string;
  model: string;
  tokens?: number;
  error?: string;
}

export async function callClaude(message: string): Promise<AIResponse> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return {
        content: content.text,
        model: 'Claude 3',
        tokens: response.usage.output_tokens
      };
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Claude API Error:', error);
    return {
      content: 'エラーが発生しました。Claude APIの呼び出しに失敗しました。',
      model: 'Claude 3',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function callMockAI(message: string, modelName: string): Promise<AIResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return {
    content: `これは${modelName}からの模擬応答です。実際のAPI統合が必要です。\n\nあなたのメッセージ: "${message}"`,
    model: modelName
  };
}