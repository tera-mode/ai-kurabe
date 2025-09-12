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
    <div className="flex flex-col h-full border border-gray-200">
      {/* Model Selection Header */}
      <div className="p-3 border-b bg-gray-50">
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => onModelSelect(panelIndex, e.target.value || null)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">モデルを選択</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
        {selectedModel && (
          <div className="text-xs text-gray-500 mt-1">
            ¥{selectedModel.costPerImage}/画像
          </div>
        )}
      </div>
      
      {/* Images Display */}
      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 ? (
          <div className="text-gray-500 text-center text-sm h-full flex items-center justify-center">
            プロンプトを入力して画像を生成してください
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={image.id} className="border rounded-lg overflow-hidden">
                {image.error ? (
                  <div className="p-4 text-red-600 text-sm bg-red-50">
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
                    <div className="p-3 bg-gray-50 text-xs text-gray-600">
                      <div className="mb-1">
                        <strong>変換後:</strong> {image.prompt}
                      </div>
                      <div>
                        <strong>元プロンプト:</strong> {image.originalPrompt}
                      </div>
                      <div className="text-gray-500 mt-1">
                        {image.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">生成中...</span>
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