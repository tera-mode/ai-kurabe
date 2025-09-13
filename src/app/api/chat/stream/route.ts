import { NextRequest } from 'next/server';
import { callClaudeStream, callGeminiStream, callMockAIStream } from '@/lib/ai-services-stream';

export async function POST(request: NextRequest) {
  try {
    const { message, modelId } = await request.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Choose appropriate streaming function based on model
          if (modelId.startsWith('claude-')) {
            await callClaudeStream(message, modelId, controller);
          } else if (modelId === 'gpt-4') {
            await callMockAIStream(message, 'GPT-4', controller);
          } else if (modelId === 'gemini-pro') {
            await callGeminiStream(message, modelId, controller);
          } else {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  error: 'Unsupported model',
                  type: 'error'
                })}\n\n`
              )
            );
          }
        } catch (error) {
          console.error('Stream Error:', error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                error: 'Internal server error',
                type: 'error'
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}