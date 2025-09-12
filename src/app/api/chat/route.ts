import { NextRequest, NextResponse } from 'next/server';
import { callClaude, callGemini, callMockAI } from '@/lib/ai-services';

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
    
    // Check if it's a Claude model
    if (modelId.startsWith('claude-')) {
      response = await callClaude(message, modelId);
    } else if (modelId === 'gpt-4') {
      response = await callMockAI(message, 'GPT-4');
    } else if (modelId === 'gemini-pro') {
      response = await callGemini(message, modelId);
    } else {
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