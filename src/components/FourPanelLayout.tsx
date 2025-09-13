'use client';

import { useState, useEffect } from 'react';
import { AIModel, Message } from '@/types';
import ChatPanel from './ChatPanel';

interface FourPanelLayoutProps {
  models: AIModel[];
  selectedModels: (AIModel | null)[];
  messages: Record<string, Message[]>;
  onModelSelect: (panelIndex: number, modelId: string | null) => void;
}

export default function FourPanelLayout({ 
  models, 
  selectedModels, 
  messages, 
  onModelSelect 
}: FourPanelLayoutProps) {
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

  // Prevent hydration mismatch by showing 2 panels until mounted
  const panelsToShow = !isMounted || isMobile ? [0, 1] : [0, 1, 2, 3];
  
  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-0 overflow-hidden">
      {panelsToShow.map((panelIndex) => (
        <ChatPanel
          key={panelIndex}
          panelIndex={panelIndex}
          selectedModel={selectedModels[panelIndex]}
          models={models}
          messages={selectedModels[panelIndex]?.id ? messages[selectedModels[panelIndex]!.id] || [] : []}
          onModelSelect={(modelId) => onModelSelect(panelIndex, modelId)}
        />
      ))}
    </div>
  );
}