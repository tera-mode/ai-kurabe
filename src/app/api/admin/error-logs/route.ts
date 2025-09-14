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

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';

    // 期間の開始時刻を計算
    const now = new Date();
    const startTime = new Date();

    switch (timeframe) {
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 24);
    }

    console.log(`[ADMIN_ERROR_LOGS] Fetching error logs for ${timeframe} (from ${startTime.toISOString()})`);

    // ダイヤ消費ログからエラーを抽出
    const errorLogsFromUsage = await db
      .collection('diamond_usage_logs')
      .where('timestamp', '>=', startTime)
      .where('metadata.success', '==', false)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    console.log(`[ADMIN_ERROR_LOGS] Found ${errorLogsFromUsage.docs.length} error logs from usage logs`);

    const errorLogs = errorLogsFromUsage.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
        modelId: data.modelId || 'unknown',
        errorType: getErrorType(data.metadata?.errorMessage || ''),
        errorMessage: data.metadata?.errorMessage || 'エラーの詳細が不明です',
        userId: data.userId || null,
        userAgent: data.userAgent || null,
      };
    });

    // エラータイプでグループ化して統計を作成
    const errorStats = new Map();
    errorLogs.forEach(log => {
      const key = `${log.errorType}-${log.modelId}`;
      if (!errorStats.has(key)) {
        errorStats.set(key, {
          errorType: log.errorType,
          modelId: log.modelId,
          count: 0,
          firstSeen: log.timestamp,
          lastSeen: log.timestamp,
        });
      }
      const stat = errorStats.get(key);
      stat.count++;
      if (log.timestamp > stat.lastSeen) {
        stat.lastSeen = log.timestamp;
      }
    });

    return NextResponse.json({
      logs: errorLogs,
      stats: Array.from(errorStats.values()),
      timeframe,
      totalErrors: errorLogs.length,
    });

  } catch (error) {
    console.error('[ADMIN_ERROR_LOGS_ERROR]', error);
    return NextResponse.json(
      { error: 'エラーログの取得に失敗しました' },
      { status: 500 }
    );
  }
}

function getErrorType(errorMessage: string): string {
  if (!errorMessage) return 'UNKNOWN_ERROR';

  const message = errorMessage.toLowerCase();

  if (message.includes('rate limit') || message.includes('quota') || message.includes('too many requests')) {
    return 'RATE_LIMIT';
  }
  if (message.includes('insufficient') || message.includes('not enough') || message.includes('ダイヤが不足')) {
    return 'INSUFFICIENT_DIAMONDS';
  }
  if (message.includes('timeout') || message.includes('time out')) {
    return 'TIMEOUT';
  }
  if (message.includes('api key') || message.includes('authentication') || message.includes('unauthorized')) {
    return 'AUTH_ERROR';
  }
  if (message.includes('invalid') || message.includes('bad request')) {
    return 'VALIDATION_ERROR';
  }
  if (message.includes('server error') || message.includes('internal error') || message.includes('500')) {
    return 'SERVER_ERROR';
  }
  if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  return 'OTHER_ERROR';
}