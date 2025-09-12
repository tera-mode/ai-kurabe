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

export async function callClaude(message: string, modelId: string): Promise<AIResponse> {
  try {
    // Get model display name
    const modelDisplayNames: Record<string, string> = {
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet (Latest)',
      'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet (June)',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
    };

    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 4000,
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
        model: modelDisplayNames[modelId] || modelId,
        tokens: response.usage.output_tokens
      };
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Claude API Error:', error);
    return {
      content: 'エラーが発生しました。Claude APIの呼び出しに失敗しました。',
      model: modelId,
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