import { NextRequest } from 'next/server';
import { callMockAIStream, callClaudeStreamWithTokenTracking, callGeminiStreamWithTokenTracking } from '@/lib/ai-services-stream';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { calculateTextDiamonds } from '@/types';

if (!getApps().length) {
  const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: credential.cert(serviceAccountKey),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { message, modelId, idToken } = await request.json();
    console.log(`[CHAT_STREAM] Received request - model: ${modelId}, hasIdToken: ${!!idToken}, idTokenStart: ${idToken?.substring(0, 20)}...`);

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 認証済みユーザーの場合、事前にダイヤをチェック
    let userId: string | null = null;
    const estimatedInputTokens = Math.ceil(message.length / 4); // おおまかな入力トークン数推定
    const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 1.5); // 出力は入力の1.5倍と推定
    const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

    if (idToken) {
      try {
        console.log('[CHAT_STREAM] Attempting to verify ID token...');
        const decodedToken = await getAuth().verifyIdToken(idToken);
        userId = decodedToken.uid;
        console.log(`[CHAT_STREAM] Token verified successfully, userId: ${userId}`);

        // 推定ダイヤ数を計算（事前チェック用）
        const estimatedDiamonds = calculateTextDiamonds(modelId, estimatedTotalTokens);

        // ユーザーの現在のダイヤ数をチェック
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const currentDiamonds = userData.diamonds || 0;

          if (currentDiamonds < estimatedDiamonds) {
            return new Response(
              JSON.stringify({
                error: `ダイヤが不足しています。推定必要数: ${estimatedDiamonds}、現在: ${currentDiamonds}`,
                code: 'INSUFFICIENT_DIAMONDS'
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        }
      } catch (authError) {
        console.error('Auth error in stream API:', authError);
        // 認証エラーでも継続（匿名ユーザーとして扱う）
        userId = null;
      }
    }

    // Create a readable stream
    let actualTokens = 0; // 実際のトークン数を追跡

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Choose appropriate streaming function based on model
          if (modelId.startsWith('claude-')) {
            actualTokens = await callClaudeStreamWithTokenTracking(message, modelId, controller);
          } else if (modelId === 'gpt-4') {
            await callMockAIStream(message, 'GPT-4', controller);
            actualTokens = estimatedTotalTokens; // モックの場合は推定値を使用
          } else if (modelId === 'gemini-pro') {
            actualTokens = await callGeminiStreamWithTokenTracking(message, modelId, controller);
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

          // AI生成完了後、認証済みユーザーのダイヤを実際のトークン数で消費
          console.log(`[CHAT_STREAM] Stream completed, attempting diamond consumption. userId: ${userId}, actualTokens: ${actualTokens}`);
          if (userId) {
            try {
              const requiredDiamonds = calculateTextDiamonds(modelId, actualTokens);
              console.log(`[CHAT_STREAM] Calculated required diamonds based on actual tokens: ${requiredDiamonds}`);

              await db.runTransaction(async (transaction) => {
                const userRef = db.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);

                if (userDoc.exists) {
                  const userData = userDoc.data()!;
                  const currentDiamonds = userData.diamonds || 0;
                  const newDiamonds = currentDiamonds - requiredDiamonds;

                  // ユーザーダイヤ更新
                  transaction.update(userRef, {
                    diamonds: Math.max(0, newDiamonds),
                    updatedAt: new Date(),
                    [`monthlyUsage.textTokens`]: (userData.monthlyUsage?.textTokens || 0) + actualTokens,
                    [`totalUsage.textTokens`]: (userData.totalUsage?.textTokens || 0) + actualTokens,
                  });

                  // 消費ログ記録
                  const logRef = db.collection('diamond_usage_logs').doc();
                  transaction.set(logRef, {
                    userId,
                    modelId,
                    actionType: 'text',
                    diamondsConsumed: requiredDiamonds,
                    diamondsBefore: currentDiamonds,
                    diamondsAfter: Math.max(0, newDiamonds),
                    metadata: {
                      tokensGenerated: actualTokens,
                      promptLength: message.length,
                      success: true,
                      estimatedTokens: estimatedTotalTokens,
                      actualTokens: actualTokens,
                    },
                    timestamp: new Date(),
                    userAgent: request.headers.get('user-agent') || '',
                    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
                  });

                  console.log(`[DIAMOND_CONSUME] User: ${userId}, Model: ${modelId}, Consumed: ${requiredDiamonds}, Remaining: ${Math.max(0, newDiamonds)}`);
                }
              });
            } catch (consumeError) {
              console.error('Diamond consumption error:', consumeError);
            }
          }
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