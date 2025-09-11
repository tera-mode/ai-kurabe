'use client';

import { AIModel } from '@/types';

interface ModelCardProps {
  model: AIModel;
  selected: boolean;
  onClick: () => void;
}

export default function ModelCard({ model, selected, onClick }: ModelCardProps) {
  return (
    <div
      className={`bg-white border rounded-lg p-3 hover:shadow-md cursor-pointer transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="font-semibold text-sm">{model.name}</div>
      <div className="text-xs text-gray-500 mt-1">{model.provider}</div>
      <div className="text-xs text-gray-400 mt-1">
        ¥{model.costPerToken}/token
      </div>
    </div>
  );
}