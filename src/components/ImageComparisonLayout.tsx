'use client';

import { useState, useEffect } from 'react';
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
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 画像版は常に2パネルのみ表示
  const panelsToShow = [0, 1];

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
      {panelsToShow.map((panelIndex) => (
        <ImagePanel
          key={panelIndex}
          panelIndex={panelIndex}
          models={models}
          selectedModel={selectedModels[panelIndex]}
          images={selectedModels[panelIndex]?.id ? images[selectedModels[panelIndex]!.id] || [] : []}
          onModelSelect={onModelSelect}
        />
      ))}
    </div>
  );
}