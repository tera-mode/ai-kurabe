'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AIStats {
  modelId: string;
  modelName: string;
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  totalDiamonds: number;
  averageResponseTime?: number;
  lastUsed?: string;
  popularityRank: number;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  modelId: string;
  errorType: string;
  errorMessage: string;
  userId?: string;
  userAgent?: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  totalUsers: number;
  activeUsers24h: number;
  totalRequests24h: number;
  errorRate24h: number;
  avgResponseTime: number;
}

export default function AIManagementPage() {
  const [aiStats, setAiStats] = useState<AIStats[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchAIData();
  }, [selectedTimeframe]);

  const fetchAIData = async () => {
    try {
      setIsLoading(true);

      const [statsResponse, logsResponse, healthResponse] = await Promise.all([
        fetch(`/api/admin/ai-stats?timeframe=${selectedTimeframe}`),
        fetch(`/api/admin/error-logs?timeframe=${selectedTimeframe}`),
        fetch('/api/admin/system-health')
      ]);

      if (!statsResponse.ok || !logsResponse.ok || !healthResponse.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [statsData, logsData, healthData] = await Promise.all([
        statsResponse.json(),
        logsResponse.json(),
        healthResponse.json()
      ]);

      setAiStats(statsData.stats || []);
      setErrorLogs(logsData.logs || []);
      setSystemHealth(healthData);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">AI統計データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                🤖 AI管理
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                AIモデルの利用統計とパフォーマンス監視
              </p>
            </div>
            <Link
              href="/debug"
              className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← デバッグTOPに戻る
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchAIData}
              className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* システム状態 */}
        {systemHealth && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              📊 システム状態
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className={`rounded-lg p-4 text-center ${
                systemHealth.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20' :
                systemHealth.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                'bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className={`text-2xl font-bold ${
                  systemHealth.status === 'healthy' ? 'text-green-600 dark:text-green-400' :
                  systemHealth.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {systemHealth.status === 'healthy' ? '🟢' : systemHealth.status === 'warning' ? '🟡' : '🔴'}
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {systemHealth.status === 'healthy' ? '正常' : systemHealth.status === 'warning' ? '注意' : 'エラー'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  稼働時間: {systemHealth.uptime}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {systemHealth.activeUsers24h}
                </div>
                <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  24時間アクティブユーザー
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  総ユーザー: {systemHealth.totalUsers}
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {systemHealth.totalRequests24h}
                </div>
                <div className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  24時間リクエスト数
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  平均応答時間: {systemHealth.avgResponseTime}ms
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {systemHealth.errorRate24h.toFixed(2)}%
                </div>
                <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  24時間エラー率
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  安全基準: &lt; 5%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 期間選択 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              📈 AI利用統計
            </h2>
            <div className="flex gap-2">
              {([
                { value: '24h' as const, label: '24時間' },
                { value: '7d' as const, label: '7日間' },
                { value: '30d' as const, label: '30日間' }
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedTimeframe(value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedTimeframe === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {aiStats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                選択した期間にAI利用データが見つかりません
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                      ランク
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                      AIモデル
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                      リクエスト数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                      成功率
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                      消費ダイヤ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                      平均応答時間
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                      最終利用
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {aiStats.map((stat, index) => (
                    <tr key={stat.modelId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {stat.modelName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {stat.modelId}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {stat.totalRequests.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          成功: {stat.successRequests} / エラー: {stat.errorRequests}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`text-sm font-medium ${
                            stat.totalRequests > 0 && (stat.successRequests / stat.totalRequests) >= 0.95
                              ? 'text-green-600 dark:text-green-400'
                              : stat.totalRequests > 0 && (stat.successRequests / stat.totalRequests) >= 0.90
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {stat.totalRequests > 0
                              ? `${((stat.successRequests / stat.totalRequests) * 100).toFixed(1)}%`
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {stat.totalDiamonds.toLocaleString()} ダイヤ
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          ≈ ¥{Math.floor(stat.totalDiamonds / 10)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {stat.averageResponseTime ? `${stat.averageResponseTime}ms` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {stat.lastUsed
                            ? new Date(stat.lastUsed).toLocaleDateString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '未使用'
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* エラーログ */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            🚨 最近のエラーログ ({selectedTimeframe})
          </h2>

          {errorLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-slate-500 dark:text-slate-400">
                選択した期間にエラーは発生していません
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {errorLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {log.errorType}
                      </span>
                      <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                        {log.modelId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString('ja-JP')}
                    </div>
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {log.errorMessage}
                  </div>
                  {(log.userId || log.userAgent) && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      {log.userId && <div>ユーザー: {log.userId.slice(0, 8)}...</div>}
                      {log.userAgent && <div>UA: {log.userAgent}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}