import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { calculateImageDiamonds, calculateTextDiamonds } from '@/types';

if (!getApps().length) {
  const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: credential.cert(serviceAccountKey),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { idToken, modelId, actionType, estimatedTokens } = await request.json();

    if (!idToken || !modelId || !actionType) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // Firebase ID Tokenを検証
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // ユーザー情報を取得
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const currentDiamonds = userData.diamonds || 0;

    // 必要ダイヤ数を計算
    let requiredDiamonds: number;
    if (actionType === 'text') {
      // テキスト生成の場合、推定トークン数を使用
      requiredDiamonds = calculateTextDiamonds(modelId, estimatedTokens || 100);
    } else {
      // 画像生成の場合
      requiredDiamonds = calculateImageDiamonds(modelId);
    }

    const hasEnoughDiamonds = currentDiamonds >= requiredDiamonds;

    console.log(`[DIAMOND_CHECK] User: ${userId}, Model: ${modelId}, Type: ${actionType}, Required: ${requiredDiamonds}, Current: ${currentDiamonds}, Sufficient: ${hasEnoughDiamonds}`);

    return NextResponse.json({
      hasEnoughDiamonds,
      currentDiamonds,
      requiredDiamonds,
      shortfall: hasEnoughDiamonds ? 0 : requiredDiamonds - currentDiamonds,
    });

  } catch (error) {
    console.error('[DIAMOND_CHECK_ERROR]', error);
    return NextResponse.json(
      { error: 'ダイヤチェック処理に失敗しました' },
      { status: 500 }
    );
  }
}