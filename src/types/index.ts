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
  displayName?: string;
  photoURL?: string;
  membershipType: 'free' | 'paid';
  diamonds: number;
  lastUsed?: Date;
  totalUsage: {
    textTokens: number;
    imagesGenerated: number;
  };
  monthlyUsage: {
    year: number;
    month: number;
    textTokens: number;
    imagesGenerated: number;
  };
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface Transaction {
  id: string;
  uid: string;
  type: 'purchase' | 'usage';
  amount: number;
  description: string;
  metadata?: {
    stripeSessionId?: string;
    tokens?: number;
    images?: number;
    model?: string;
  };
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export interface UsageLimit {
  canUse: boolean;
  reason?: 'free_limit' | 'insufficient_diamonds';
  nextAvailableDate?: Date;
  requiredDiamonds?: number;
}

// 画像生成モデル別の原価（円）
export const IMAGE_MODEL_COSTS = {
  'gemini-imagen3': 2.9,                // Gemini 2.5 Flash Image (実際のモデルID)
  'google-imagen4': 2.9,                // Google Imagen 4 (実際のモデルID)
  'flux-pro-1.1': 2.975,                // FLUX Pro 1.1
  'dall-e-3': 2.9,                      // DALL-E 3 (将来)
  'replicate-sdxl': 1.86,               // Stable Diffusion XL
  'midjourney': 2.9,                    // Midjourney (将来)
  'leonardo-ai': 2.9                    // Leonardo AI (将来)
} as const;

// テキストモデル別の原価（円/token）
export const TEXT_MODEL_COSTS = {
  'claude-3-5-sonnet-20241022': 0.000212,    // Claude 3.5 Sonnet (Latest)
  'claude-3-5-sonnet-20240620': 0.000212,    // Claude 3.5 Sonnet (June)
  'claude-3-5-haiku-20241022': 0.0000446,    // Claude 3.5 Haiku
  'claude-3-opus-20240229': 0.000847,        // Claude 3 Opus
  'claude-3-sonnet-20240229': 0.000212,      // Claude 3 Sonnet
  'claude-3-haiku-20240307': 0.0001185,      // Claude 3 Haiku
  'gpt-4': 0.001692,                         // GPT-4 (将来)
  'gemini-pro': 0.0000019                    // Gemini Pro
} as const;

export const PRICING = {
  DIAMOND_RATE: 500,                   // ¥500
  DIAMONDS_PER_500YEN: 5000,           // 5,000ダイヤ
  DIAMOND_VALUE: 0.1,                  // 1ダイヤ = ¥0.1
  PROFIT_MARGIN: 20,                   // 20倍利益率
  BASE_COST_UNIT: 0.01,                // 基準原価単位 ¥0.01
  MINIMUM_CONSUMPTION: 1,              // 最低消費: 1ダイヤ
  FREE_USER_COOLDOWN_DAYS: 7
} as const;

// 動的ダイヤ消費計算関数
export function calculateImageDiamonds(modelId: string): number {
  const baseCost = IMAGE_MODEL_COSTS[modelId as keyof typeof IMAGE_MODEL_COSTS];
  if (!baseCost) return 1; // デフォルト

  // 原価 × 利益率 ÷ ダイヤ価値 = 必要ダイヤ数
  const diamonds = Math.ceil((baseCost * PRICING.PROFIT_MARGIN) / PRICING.DIAMOND_VALUE);
  return Math.max(diamonds, PRICING.MINIMUM_CONSUMPTION);
}

export function calculateTextDiamonds(modelId: string, tokens: number): number {
  const baseCostPerToken = TEXT_MODEL_COSTS[modelId as keyof typeof TEXT_MODEL_COSTS];
  if (!baseCostPerToken) return Math.max(Math.ceil(tokens * 0.1), PRICING.MINIMUM_CONSUMPTION);

  // (原価/token × token数) × 利益率 ÷ ダイヤ価値 = 必要ダイヤ数
  const totalCost = baseCostPerToken * tokens;
  const diamonds = Math.ceil((totalCost * PRICING.PROFIT_MARGIN) / PRICING.DIAMOND_VALUE);
  return Math.max(diamonds, PRICING.MINIMUM_CONSUMPTION);
}