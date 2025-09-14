import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { cookies } from 'next/headers';

if (!getApps().length) {
  const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: credential.cert(serviceAccountKey),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session');

    if (!sessionToken || !sessionToken.value.startsWith('YWRtaW5fc2Vzc2lvbl8')) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      );
    }

    const { userId, diamonds } = await request.json();

    if (!userId || !diamonds || typeof diamonds !== 'number' || diamonds <= 0) {
      return NextResponse.json(
        { error: '有効なユーザーIDとダイヤ数が必要です' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN_ADD_DIAMONDS] Adding ${diamonds} diamonds to user ${userId}`);

    // トランザクション内でダイヤ追加を実行
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('ユーザーが見つかりません');
      }

      const userData = userDoc.data()!;
      const currentDiamonds = userData.diamonds || 0;
      const newDiamonds = currentDiamonds + diamonds;

      // ユーザードキュメントを更新
      transaction.update(userRef, {
        diamonds: newDiamonds,
        updatedAt: new Date(),
      });

      // 管理者によるダイヤ追加ログを記録
      const logRef = db.collection('admin_diamond_logs').doc();
      transaction.set(logRef, {
        userId,
        action: 'add_diamonds',
        diamondsAdded: diamonds,
        diamondsBefore: currentDiamonds,
        diamondsAfter: newDiamonds,
        adminAction: true,
        timestamp: new Date(),
        adminIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || '',
      });

      return {
        success: true,
        newDiamonds,
        added: diamonds,
        previousDiamonds: currentDiamonds,
      };
    });

    console.log(`[ADMIN_ADD_DIAMONDS] Successfully added ${diamonds} diamonds to user ${userId}. New balance: ${result.newDiamonds}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[ADMIN_ADD_DIAMONDS_ERROR]', error);

    if (error instanceof Error && error.message === 'ユーザーが見つかりません') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'ダイヤ追加処理に失敗しました' },
      { status: 500 }
    );
  }
}