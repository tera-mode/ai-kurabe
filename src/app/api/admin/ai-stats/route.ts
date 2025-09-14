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

    console.log(`[ADMIN_AI_STATS] Fetching AI stats for ${timeframe} (from ${startTime.toISOString()})`);

    // ダイヤ消費ログから統計を集計
    const logsSnapshot = await db
      .collection('diamond_usage_logs')
      .where('timestamp', '>=', startTime)
      .orderBy('timestamp', 'desc')
      .get();

    console.log(`[ADMIN_AI_STATS] Found ${logsSnapshot.docs.length} usage logs`);

    // モデル別統計を集計
    const modelStats = new Map();

    logsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const modelId = data.modelId || 'unknown';
      const success = data.metadata?.success !== false;

      if (!modelStats.has(modelId)) {
        modelStats.set(modelId, {
          modelId,
          modelName: getModelDisplayName(modelId),
          totalRequests: 0,
          successRequests: 0,
          errorRequests: 0,
          totalDiamonds: 0,
          responseTimes: [],
          lastUsed: null,
        });
      }

      const stats = modelStats.get(modelId);
      stats.totalRequests++;

      if (success) {
        stats.successRequests++;
      } else {
        stats.errorRequests++;
      }

      stats.totalDiamonds += data.diamondsConsumed || 0;

      // 応答時間を記録（メタデータから取得）
      if (data.metadata?.responseTime) {
        stats.responseTimes.push(data.metadata.responseTime);
      }

      // 最終利用日を更新
      const timestamp = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      if (!stats.lastUsed || timestamp > stats.lastUsed) {
        stats.lastUsed = timestamp;
      }
    });

    // 統計を配列に変換し、人気順にソート
    const statsArray = Array.from(modelStats.values()).map((stats, index) => ({
      ...stats,
      averageResponseTime: stats.responseTimes.length > 0
        ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
        : undefined,
      lastUsed: stats.lastUsed ? stats.lastUsed.toISOString() : null,
      popularityRank: index + 1,
    }));

    // リクエスト数で降順ソート
    statsArray.sort((a, b) => b.totalRequests - a.totalRequests);

    // ランキングを更新
    statsArray.forEach((stat, index) => {
      stat.popularityRank = index + 1;
    });

    console.log(`[ADMIN_AI_STATS] Generated stats for ${statsArray.length} models`);

    return NextResponse.json({
      stats: statsArray,
      timeframe,
      totalModels: statsArray.length,
      totalRequests: statsArray.reduce((sum, stat) => sum + stat.totalRequests, 0),
      totalDiamonds: statsArray.reduce((sum, stat) => sum + stat.totalDiamonds, 0),
    });

  } catch (error) {
    console.error('[ADMIN_AI_STATS_ERROR]', error);
    return NextResponse.json(
      { error: 'AI統計の取得に失敗しました' },
      { status: 500 }
    );
  }
}

function getModelDisplayName(modelId: string): string {
  const modelNames: Record<string, string> = {
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
    'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
    'gemini-1.5-pro-latest': 'Gemini 1.5 Pro',
    'gemini-2.5-flash-image': 'Gemini 2.5 Flash Image',
    'imagen-4': 'Google Imagen 4',
    'flux-pro-1.1': 'FLUX Pro 1.1',
    'gpt-4': 'GPT-4',
    'gpt-4-turbo': 'GPT-4 Turbo',
  };

  return modelNames[modelId] || modelId;
}