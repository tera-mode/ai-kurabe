import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

if (!getApps().length) {
  const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: credential.cert(serviceAccountKey),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { idToken, diamonds, modelId, actionType, metadata } = await request.json();

    if (!idToken || !diamonds || !modelId || !actionType) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // Firebase ID Tokenを検証
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // トランザクション内でダイヤ消費を実行
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('ユーザーが見つかりません');
      }

      const userData = userDoc.data()!;
      const currentDiamonds = userData.diamonds || 0;

      // ダイヤ不足チェック
      if (currentDiamonds < diamonds) {
        throw new Error(`ダイヤが不足しています。必要: ${diamonds}, 現在: ${currentDiamonds}`);
      }

      const newDiamonds = currentDiamonds - diamonds;

      // ユーザードキュメントを更新
      transaction.update(userRef, {
        diamonds: newDiamonds,
        updatedAt: new Date(),
        // 月次・総利用量も更新
        [`monthlyUsage.${actionType === 'text' ? 'textTokens' : 'imagesGenerated'}`]:
          (userData.monthlyUsage?.[actionType === 'text' ? 'textTokens' : 'imagesGenerated'] || 0) + 1,
        [`totalUsage.${actionType === 'text' ? 'textTokens' : 'imagesGenerated'}`]:
          (userData.totalUsage?.[actionType === 'text' ? 'textTokens' : 'imagesGenerated'] || 0) + 1,
      });

      // ダイヤ消費ログを記録
      const logRef = db.collection('diamond_usage_logs').doc();
      transaction.set(logRef, {
        userId,
        modelId,
        actionType,
        diamondsConsumed: diamonds,
        diamondsBefore: currentDiamonds,
        diamondsAfter: newDiamonds,
        metadata: metadata || {},
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      });

      return {
        success: true,
        newDiamonds,
        consumed: diamonds,
      };
    });

    console.log(`[DIAMOND_CONSUME] User: ${userId}, Model: ${modelId}, Type: ${actionType}, Consumed: ${diamonds}, Remaining: ${result.newDiamonds}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[DIAMOND_CONSUME_ERROR]', error);

    if (error instanceof Error && error.message.includes('ダイヤが不足')) {
      return NextResponse.json(
        { error: error.message, code: 'INSUFFICIENT_DIAMONDS' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'ダイヤ消費処理に失敗しました' },
      { status: 500 }
    );
  }
}