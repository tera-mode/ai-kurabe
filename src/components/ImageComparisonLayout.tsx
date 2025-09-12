'use client';

import { ImageModel, GeneratedImage } from '@/types';
import ImagePanel from './ImagePanel';

interface ImageComparisonLayoutProps {
  models: ImageModel[];
  selectedModels: (ImageModel | null)[];
  images: Record<string, GeneratedImage[]>;
  onModelSelect: (panelIndex: number, modelId: string | null) => void;
}

export default function ImageComparisonLayout({
  models,
  selectedModels,
  images,
  onModelSelect
}: ImageComparisonLayoutProps) {
  return (
    <div className="flex-1 grid grid-cols-2 gap-0 min-h-0">
      {selectedModels.map((model, index) => (
        <ImagePanel
          key={index}
          panelIndex={index}
          models={models}
          selectedModel={model}
          images={model ? images[model.id] || [] : []}
          onModelSelect={onModelSelect}
        />
      ))}
    </div>
  );
}