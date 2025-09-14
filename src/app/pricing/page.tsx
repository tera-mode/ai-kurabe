'use client';

import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import PageLayout from '@/components/PageLayout';
import MobileHeader from '@/components/MobileHeader';
import { useAuth } from '@/hooks/useAuth';
import { PRICING, IMAGE_MODEL_COSTS, TEXT_MODEL_COSTS, calculateImageDiamonds, calculateTextDiamonds } from '@/types';

const pricingPlans = [
  {
    name: '無料プラン',
    price: '¥0',
    period: '永続無料',
    description: 'AIくらべを試してみたい方に最適',
    features: [
      `${PRICING.FREE_USER_COOLDOWN_DAYS}日間に1回利用可能`,
      'すべてのAIモデルにアクセス可能',
      'テキストAI比較（4モデル同時）',
      '画像生成AI比較（2モデル同時）',
      'レスポンシブデザイン対応'
    ],
    limitations: [
      '利用頻度に制限があります',
      'ダイヤの購入が必要な場合があります'
    ],
    buttonText: '現在のプラン',
    buttonVariant: 'secondary' as const,
    popular: false
  },
  {
    name: '従量課金プラン',
    price: '¥500',
    period: '～',
    description: 'AI利用量に応じて支払い',
    features: [
      '5,000ダイヤ獲得（¥500ごと）',
      'テキストAI: 使用モデル・回数に応じた課金',
      '画像生成AI: 使用モデルに応じた課金',
      '例）Claude軽い質問: 42ダイヤ/回（118回可能）',
      '例）Imagen4: 580ダイヤ/画像（8枚可能）',
      '無制限利用（ダイヤがある限り）',
      '詳細な使用量レポート',
      'プリミアムサポート'
    ],
    limitations: [],
    buttonText: 'ダイヤを購入',
    buttonVariant: 'primary' as const,
    popular: true
  }
];

const features = [
  {
    icon: '🤖',
    title: 'テキストAI比較',
    description: 'Claude、GPT-4、Geminiなど複数のAIモデルを同時に比較できます'
  },
  {
    icon: '🎨',
    title: '画像生成AI比較',
    description: 'FLUX Pro、Gemini Imagen、DALL-E など最新の画像生成モデルを比較'
  },
  {
    icon: '📱',
    title: 'レスポンシブデザイン',
    description: 'PC・モバイル・タブレット すべてのデバイスで最適な体験'
  },
  {
    icon: '⚡',
    title: 'リアルタイム',
    description: 'ストリーミング対応でAIの回答をリアルタイムで確認'
  },
  {
    icon: '🛡️',
    title: 'セキュア',
    description: 'Firebase認証による安全なユーザー管理とデータ保護'
  },
  {
    icon: '💎',
    title: 'ダイヤシステム',
    description: '透明性の高い従量課金システムで無駄なく利用'
  }
];

const faqs = [
  {
    question: 'ダイヤとは何ですか？',
    answer: 'ダイヤはAIくらべ内で使用する仮想通貨です。1ダイヤ = ¥0.1の価値があります。テキスト・画像生成は各AIモデルの原価に応じて消費ダイヤが決まり、原価の10倍が売価となります。'
  },
  {
    question: '無料プランでは何ができますか？',
    answer: `無料プランでは${PRICING.FREE_USER_COOLDOWN_DAYS}日間に1回、すべての機能を利用できます。制限はありますが、AIくらべの全機能を体験していただけます。`
  },
  {
    question: '従量課金はどのように計算されますか？',
    answer: '各AIモデルの実際の原価に基づいて計算されます。例：Claude軽い質問（原価¥4.24）→42ダイヤ消費、Imagen4（原価¥58）→580ダイヤ消費。使用前に推定コストが表示されます。'
  },
  {
    question: 'プランの変更はいつでもできますか？',
    answer: 'はい、いつでもダイヤを購入して従量課金プランに変更できます。追加料金や解約手数料はありません。'
  },
  {
    question: '返金は可能ですか？',
    answer: '未使用のダイヤについては、購入から30日以内であれば返金対応いたします。詳細はお問い合わせください。'
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = '/?login=true';
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('認証情報が取得できませんでした');
      }

      const idToken = await currentUser.getIdToken();
      const amount = 500; // ¥500

      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済セッションの作成に失敗しました');
      }

      // Stripe決済ページにリダイレクト
      window.location.href = data.url;

    } catch (error) {
      console.error('決済エラー:', error);
      alert(error instanceof Error ? error.message : '決済の開始に失敗しました');
    }
  };

  return (
    <>
      <MobileHeader />

      <PageLayout
        title="価格プラン"
        subtitle="あなたに最適なプランをお選びください"
        currentPage="text"
      >
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
            {/* プラン比較 */}
            <section>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  シンプルで透明な価格体系
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  無料でお試しいただけます。本格利用時は使った分だけお支払いください。
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {pricingPlans.map((plan, index) => (
                  <div
                    key={plan.name}
                    className={`
                      relative rounded-2xl p-6 md:p-8 border-2 transition-all duration-200
                      ${plan.popular
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 transform scale-105 shadow-xl'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-lg hover:shadow-xl'
                      }
                    `}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          おすすめ
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                          {plan.price}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {plan.period}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {plan.description}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, idx) => (
                        <li key={`limit-${idx}`} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {limitation}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={plan.buttonVariant === 'primary' ? handlePurchase : undefined}
                      disabled={plan.buttonVariant === 'secondary'}
                      className={`
                        w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200
                        ${plan.buttonVariant === 'primary'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 利用目安 */}
            <section>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  ¥500でどのくらい使える？
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  人気モデルでの利用目安をご紹介
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* テキストAI利用目安 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>🤖</span> テキストAI（Claude 3.5 Sonnet）
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        約 118
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        軽い質問・回答が可能
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <div className="mb-2">🔹 技術的質問: 56回</div>
                      <div className="mb-2">🔹 プログラミング支援: 29回</div>
                      <div>🔹 長文作成: 21回</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                      ※Gemini 1.5 Flashなら1,319回の技術的質問が可能
                    </div>
                  </div>
                </div>

                {/* 画像生成AI利用目安 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>🎨</span> 画像生成（Google Imagen 4）
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        約 8
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        高品質画像生成可能
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <div className="mb-2">🔹 FLUX 1.1 Pro: 8枚</div>
                      <div className="mb-2">🔹 FLUX Dev: 13枚</div>
                      <div>🔹 Gemini Image: 約1,000枚</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                      ※コストが安いモデルならより多くの画像生成が可能
                    </div>
                  </div>
                </div>
              </div>

              {/* 混合利用例 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700 text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  💡 混合利用例（¥500の使い方）
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-400">ライティング作業</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">
                      長文作成 8回 + 技術質問 5回
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      約234円 (2,336ダイヤ)
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-400">プログラミング作業</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">
                      コード生成 10回 + 軽い質問 20回
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      約173円 (1,730ダイヤ)
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-400">クリエイティブ作業</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">
                      画像生成 3枚 + 技術質問 10回
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      約263円 (2,631ダイヤ)
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 機能一覧 */}
            <section>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  AIくらべの特徴
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  複数のAIモデルを効率的に比較できる機能をご提供
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* よくある質問 */}
            <section>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  よくある質問
                </h2>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full text-left p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {faq.question}
                      </span>
                      <svg
                        className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                          openFaqIndex === index ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFaqIndex === index && (
                      <div className="px-6 pb-6">
                        <p className="text-slate-600 dark:text-slate-400">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="text-center py-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  今すぐAIくらべを始めてみませんか？
                </h2>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  無料プランでAIモデルの比較を体験し、必要に応じて従量課金で本格活用できます
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/"
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    無料で始める
                  </a>
                  <button
                    onClick={handlePurchase}
                    className="bg-blue-700 hover:bg-blue-800 px-8 py-3 rounded-lg font-semibold transition-colors border-2 border-blue-400"
                  >
                    ダイヤを購入
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageLayout>
    </>
  );
}