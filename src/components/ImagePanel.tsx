'use client';

import { ImageModel, GeneratedImage } from '@/types';

interface ImagePanelProps {
  panelIndex: number;
  models: ImageModel[];
  selectedModel: ImageModel | null;
  images: GeneratedImage[];
  onModelSelect: (panelIndex: number, modelId: string | null) => void;
}

export default function ImagePanel({
  panelIndex,
  models,
  selectedModel,
  images,
  onModelSelect
}: ImagePanelProps) {
  return (
    <div className="flex flex-col h-full border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow border-b-2 border-slate-200 dark:border-slate-700 md:border-b-0 overflow-hidden bg-white dark:bg-slate-800">
      {/* Model Selection Header */}
      <div className="p-3 md:px-6 md:py-4 border-b bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => onModelSelect(panelIndex, e.target.value || null)}
          className="w-full p-2 border border-gray-300 dark:border-slate-500 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-600 text-gray-900 dark:text-gray-100"
        >
          <option value="">モデルを選択</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
        {selectedModel && (
          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            ¥{selectedModel.costPerImage}/画像
          </div>
        )}
      </div>
      
      {/* Images Display */}
      <div className="flex-1 overflow-y-auto p-4 md:px-6 md:py-4 min-h-0">
        {images.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center text-sm h-full flex items-center justify-center">
            プロンプトを入力して画像を生成してください
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={image.id} className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                {image.error ? (
                  <div className="p-4 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30">
                    {image.error}
                  </div>
                ) : image.url ? (
                  <div>
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-auto max-h-96 object-contain"
                      loading="lazy"
                    />
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 text-xs text-gray-600 dark:text-gray-300">
                      <div className="mb-1">
                        <strong>変換後:</strong> {image.prompt}
                      </div>
                      <div>
                        <strong>元プロンプト:</strong> {image.originalPrompt}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                        {image.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center justify-center bg-gray-100 dark:bg-slate-700">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">生成中...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}