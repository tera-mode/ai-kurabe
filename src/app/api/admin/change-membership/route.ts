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

    const { userId, membershipType } = await request.json();

    if (!userId || !membershipType || !['free', 'paid'].includes(membershipType)) {
      return NextResponse.json(
        { error: '有効なユーザーIDとメンバーシップタイプが必要です' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN_CHANGE_MEMBERSHIP] Changing membership for user ${userId} to ${membershipType}`);

    // トランザクション内でメンバーシップ変更を実行
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('ユーザーが見つかりません');
      }

      const userData = userDoc.data()!;
      const previousMembershipType = userData.membershipType || 'free';

      // ユーザードキュメントを更新
      transaction.update(userRef, {
        membershipType: membershipType,
        updatedAt: new Date(),
        // 有料から無料への変更時は、特定の処理を追加することも可能
        ...(membershipType === 'free' && previousMembershipType === 'paid' && {
          // 必要に応じて無料プラン制限を適用
          lastFreeUsed: null,
          nextFreeDate: null,
        }),
      });

      // 管理者によるメンバーシップ変更ログを記録
      const logRef = db.collection('admin_membership_logs').doc();
      transaction.set(logRef, {
        userId,
        action: 'change_membership',
        previousMembershipType,
        newMembershipType: membershipType,
        adminAction: true,
        timestamp: new Date(),
        adminIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || '',
      });

      return {
        success: true,
        newMembershipType: membershipType,
        previousMembershipType,
        userId,
      };
    });

    console.log(`[ADMIN_CHANGE_MEMBERSHIP] Successfully changed membership for user ${userId} from ${result.previousMembershipType} to ${result.newMembershipType}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[ADMIN_CHANGE_MEMBERSHIP_ERROR]', error);

    if (error instanceof Error && error.message === 'ユーザーが見つかりません') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'メンバーシップ変更処理に失敗しました' },
      { status: 500 }
    );
  }
}