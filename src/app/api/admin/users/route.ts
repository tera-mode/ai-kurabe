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

export async function GET(request: NextRequest) {
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

    console.log('[ADMIN_USERS] Fetching user list...');

    // ユーザー一覧を取得
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || null,
        diamonds: data.diamonds || 0,
        membershipType: data.membershipType || 'free',
        plan: data.plan || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt || null,
        totalUsage: {
          textTokens: data.totalUsage?.textTokens || 0,
          imagesGenerated: data.totalUsage?.imagesGenerated || 0,
        },
        monthlyUsage: {
          textTokens: data.monthlyUsage?.textTokens || 0,
          imagesGenerated: data.monthlyUsage?.imagesGenerated || 0,
        },
        nextFreeDate: data.nextFreeDate?.toDate?.()?.toISOString() || data.nextFreeDate || null,
      };
    });

    console.log(`[ADMIN_USERS] Retrieved ${users.length} users`);

    return NextResponse.json({
      users,
      total: users.length,
      paidUsers: users.filter(u => u.membershipType === 'paid').length,
      freeUsers: users.filter(u => u.membershipType === 'free').length,
    });

  } catch (error) {
    console.error('[ADMIN_USERS_ERROR]', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}