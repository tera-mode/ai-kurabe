export interface AIModel {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  costPerToken: number;
  maxTokens: number;
  isActive: boolean;
  displayOrder: number;
}

export interface User {
  uid: string;
  email: string;
  plan: 'free' | 'basic' | 'pro';
  requestCount: number;
  lastResetDate: Date;
  stripeCustomerId?: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  modelId?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  models: string[];
  messages: Message[];
  createdAt: Date;
}

export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  costPerImage: number;
  maxPromptLength: number;
  isActive: boolean;
  displayOrder: number;
  promptConverter: string;
}

export interface GeneratedImage {
  id: string;
  url: string | null;
  prompt: string;
  originalPrompt: string;
  timestamp: Date;
  modelId: string;
  error?: string | null;
}