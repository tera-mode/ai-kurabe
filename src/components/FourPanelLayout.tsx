'use client';

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
  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-0 min-h-0">
      {[0, 1, 2, 3].map((panelIndex) => (
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