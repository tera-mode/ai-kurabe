'use client';

import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import ImageComparisonLayout from '@/components/ImageComparisonLayout';
import ImagePromptInput from '@/components/ImagePromptInput';
import MobileHeader from '@/components/MobileHeader';
import { useAuth } from '@/hooks/useAuth';
import { getAuth } from 'firebase/auth';
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
  const { user, signOut, refreshUserData } = useAuth();
  const [selectedModels, setSelectedModels] = useState<(ImageModel | null)[]>([
    imageModels[0], // Gemini 2.5 Flash Image
    imageModels[1]  // Google Imagen 4
  ]);
  const [images, setImages] = useState<Record<string, GeneratedImage[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      // Clear images after logout
      setImages({});
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

    // Get ID token for authenticated users
    let idToken: string | undefined;
    try {
      if (user) {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          idToken = await currentUser.getIdToken();
        }
      }
    } catch (authError) {
      console.log('User not authenticated, continuing without diamond consumption');
    }

    const promises = activeModels.map(async (model) => {
      try {
        const response = await fetch('/api/image-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            modelId: model.id,
            idToken
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

    // Refresh user data to get updated diamond balance
    if (user) {
      refreshUserData();
    }

    setIsLoading(false);
  };

  return (
    <>
      <MobileHeader />

      <PageLayout
        title="画像生成AI比較"
        subtitle="複数の画像生成AIモデルを同時に比較"
        currentPage="image"
      >
        <div className="flex-1 min-h-0">
          <ImageComparisonLayout
            models={imageModels}
            selectedModels={selectedModels}
            images={images}
            onModelSelect={handleModelSelect}
          />
        </div>
        
        <div className="flex-shrink-0">
          <ImagePromptInput
            onGenerate={handleGenerateImages}
            disabled={isLoading}
            activeModelCount={activeModelCount}
          />
        </div>
      </PageLayout>
    </>
  );
}