import { NextRequest, NextResponse } from 'next/server';
import { callClaude, callMockAI } from '@/lib/ai-services';

export async function POST(request: NextRequest) {
  try {
    const { message, modelId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let response;
    
    switch (modelId) {
      case 'claude-3':
        response = await callClaude(message);
        break;
      case 'gpt-4':
        response = await callMockAI(message, 'GPT-4');
        break;
      case 'gemini-pro':
        response = await callMockAI(message, 'Gemini Pro');
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported model' },
          { status: 400 }
        );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}