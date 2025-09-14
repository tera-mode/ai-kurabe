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

// アプリケーション開始時刻（簡易的な稼働時間計算用）
const appStartTime = new Date();

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

    console.log('[ADMIN_SYSTEM_HEALTH] Fetching system health data...');

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 24時間以内の統計を並行取得
    const [usersSnapshot, logsSnapshot, errorLogsSnapshot] = await Promise.all([
      // 総ユーザー数とアクティブユーザー数
      db.collection('users').get(),
      // 24時間以内のリクエスト数
      db.collection('diamond_usage_logs')
        .where('timestamp', '>=', twentyFourHoursAgo)
        .get(),
      // 24時間以内のエラー数
      db.collection('diamond_usage_logs')
        .where('timestamp', '>=', twentyFourHoursAgo)
        .where('metadata.success', '==', false)
        .get()
    ]);

    // アクティブユーザー（24時間以内にログインまたは利用したユーザー）
    const activeUserIds = new Set();
    const responseTimes: number[] = [];

    logsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        activeUserIds.add(data.userId);
      }

      // 応答時間を収集
      if (data.metadata?.responseTime && typeof data.metadata.responseTime === 'number') {
        responseTimes.push(data.metadata.responseTime);
      }
    });

    // 最近24時間以内にログインしたユーザーも追加
    const recentLoginUsers = await db.collection('users')
      .where('lastLoginAt', '>=', twentyFourHoursAgo)
      .get();

    recentLoginUsers.docs.forEach(doc => {
      activeUserIds.add(doc.id);
    });

    // 統計計算
    const totalUsers = usersSnapshot.docs.length;
    const activeUsers24h = activeUserIds.size;
    const totalRequests24h = logsSnapshot.docs.length;
    const errorCount24h = errorLogsSnapshot.docs.length;
    const errorRate24h = totalRequests24h > 0 ? (errorCount24h / totalRequests24h) * 100 : 0;
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // 稼働時間計算
    const uptimeMs = now.getTime() - appStartTime.getTime();
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const uptime = uptimeHours > 24
      ? `${Math.floor(uptimeHours / 24)}日${uptimeHours % 24}時間`
      : `${uptimeHours}時間${uptimeMinutes}分`;

    // システム健全性判定
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    if (errorRate24h > 10) {
      status = 'error';
    } else if (errorRate24h > 5 || avgResponseTime > 5000) {
      status = 'warning';
    }

    const healthData = {
      status,
      uptime,
      totalUsers,
      activeUsers24h,
      totalRequests24h,
      errorRate24h: Math.round(errorRate24h * 100) / 100, // 小数点2位まで
      avgResponseTime,
      lastUpdate: now.toISOString(),
      metrics: {
        userGrowthRate: totalUsers > 0 ? Math.round((activeUsers24h / totalUsers) * 100) : 0,
        systemLoad: 'normal', // 簡易実装
        memoryUsage: 'optimal', // 簡易実装
        diskUsage: 'optimal', // 簡易実装
      }
    };

    console.log(`[ADMIN_SYSTEM_HEALTH] System status: ${status}, Users: ${totalUsers}/${activeUsers24h}, Requests: ${totalRequests24h}, Error rate: ${errorRate24h}%`);

    return NextResponse.json(healthData);

  } catch (error) {
    console.error('[ADMIN_SYSTEM_HEALTH_ERROR]', error);
    return NextResponse.json(
      { error: 'システム状態の取得に失敗しました' },
      { status: 500 }
    );
  }
}