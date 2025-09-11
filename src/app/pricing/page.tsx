export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">料金プラン</h1>
          <p className="text-xl text-gray-600">あなたに最適なプランを選択してください</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">無料体験</h3>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              ¥0<span className="text-lg font-normal text-gray-500">/月</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                1日3回まで利用可能
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                基本的なAIモデル比較
              </li>
            </ul>
            <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
              今すぐ始める
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500">
            <div className="text-center mb-2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">人気</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">基本プラン</h3>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              ¥980<span className="text-lg font-normal text-gray-500">/月</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                月100リクエスト込み
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                全AIモデル利用可能
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                チャット履歴保存
              </li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              選択する
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">プロプラン</h3>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              ¥2,980<span className="text-lg font-normal text-gray-500">/月</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                月500リクエスト込み
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                優先サポート
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                高度な分析機能
              </li>
            </ul>
            <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
              選択する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}