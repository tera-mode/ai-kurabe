'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageComparisonLayout from '@/components/ImageComparisonLayout';
import ImagePromptInput from '@/components/ImagePromptInput';
import { ImageModel, GeneratedImage } from '@/types';

const imageModels: ImageModel[] = [
  {
    id: 'gemini-imagen3',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    costPerImage: 0.04,
    maxPromptLength: 1000,
    isActive: true,
    displayOrder: 1,
    promptConverter: 'gemini-imagen'
  },
  {
    id: 'google-imagen4',
    name: 'Google Imagen 4',
    provider: 'Google',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    costPerImage: 0.04,
    maxPromptLength: 1000,
    isActive: true,
    displayOrder: 2,
    promptConverter: 'google-imagen'
  },
  {
    id: 'flux-pro-1.1',
    name: 'FLUX Pro 1.1',
    provider: 'Black Forest Labs',
    apiEndpoint: 'https://api.bfl.ai/v1/flux-kontext-pro',
    costPerImage: 0.05,
    maxPromptLength: 1000,
    isActive: true,
    displayOrder: 3,
    promptConverter: 'flux'
  }
];

export default function ImageComparison() {
  const [selectedModels, setSelectedModels] = useState<(ImageModel | null)[]>([
    imageModels[0], // Gemini 2.5 Flash Image
    imageModels[1]  // Google Imagen 4
  ]);
  const [images, setImages] = useState<Record<string, GeneratedImage[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleModelSelect = (panelIndex: number, modelId: string | null) => {
    const model = modelId ? imageModels.find(m => m.id === modelId) || null : null;
    setSelectedModels(prev => {
      const updated = [...prev];
      updated[panelIndex] = model;
      return updated;
    });
  };

  const activeModels = selectedModels.filter(model => model !== null) as ImageModel[];
  const activeModelCount = activeModels.length;

  const handleGenerateImages = async (prompt: string) => {
    if (activeModelCount === 0) return;

    setIsLoading(true);
    
    const promises = activeModels.map(async (model) => {
      try {
        const response = await fetch('/api/image-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            modelId: model.id
          })
        });

        const data = await response.json();
        
        const generatedImage: GeneratedImage = {
          id: `${Date.now()}-${model.id}-${Math.random()}`,
          url: data.error ? null : data.imageUrl,
          prompt: data.convertedPrompt || prompt,
          originalPrompt: prompt,
          timestamp: new Date(),
          modelId: model.id,
          error: data.error || null
        };

        setImages(prev => ({
          ...prev,
          [model.id]: [...(prev[model.id] || []), generatedImage]
        }));
      } catch (error) {
        const errorImage: GeneratedImage = {
          id: `${Date.now()}-${model.id}-error`,
          url: null,
          prompt: prompt,
          originalPrompt: prompt,
          timestamp: new Date(),
          modelId: model.id,
          error: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`
        };

        setImages(prev => ({
          ...prev,
          [model.id]: [...(prev[model.id] || []), errorImage]
        }));
      }
    });

    await Promise.all(promises);
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">画像生成AI比較</h1>
            <p className="text-sm text-gray-600">複数の画像生成AIモデルを同時に比較</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              テキストAI比較
            </Link>
            <Link href="/image" className="text-gray-900 text-sm font-medium border-b-2 border-blue-600">
              画像生成AI比較
            </Link>
          </div>
        </div>
      </header>
      
      <ImageComparisonLayout
        models={imageModels}
        selectedModels={selectedModels}
        images={images}
        onModelSelect={handleModelSelect}
      />
      
      <ImagePromptInput
        onGenerate={handleGenerateImages}
        disabled={isLoading}
        activeModelCount={activeModelCount}
      />
    </div>
  );
}