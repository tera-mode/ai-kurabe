'use client';

import { useState } from 'react';
import { getAuth } from 'firebase/auth';

interface DiamondCheckResult {
  hasEnoughDiamonds: boolean;
  currentDiamonds: number;
  requiredDiamonds: number;
  shortfall: number;
}

interface DiamondConsumeResult {
  success: boolean;
  newDiamonds: number;
  consumed: number;
}

interface DiamondConsumeParams {
  modelId: string;
  actionType: 'text' | 'image';
  metadata?: {
    tokensGenerated?: number;
    promptLength?: number;
    responseLength?: number;
    success?: boolean;
    errorMessage?: string;
  };
}

export function useDiamonds() {
  const [isChecking, setIsChecking] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);

  const checkDiamonds = async (
    modelId: string,
    actionType: 'text' | 'image',
    estimatedTokens?: number
  ): Promise<DiamondCheckResult | null> => {
    try {
      setIsChecking(true);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('認証が必要です');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/user/check-diamonds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          modelId,
          actionType,
          estimatedTokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ダイヤチェックに失敗しました');
      }

      console.log(`[DIAMOND_CHECK] ${actionType} ${modelId}: required=${data.requiredDiamonds}, current=${data.currentDiamonds}, sufficient=${data.hasEnoughDiamonds}`);

      return data;

    } catch (error) {
      console.error('Diamond check error:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const consumeDiamonds = async (
    diamonds: number,
    params: DiamondConsumeParams
  ): Promise<DiamondConsumeResult | null> => {
    try {
      setIsConsuming(true);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('認証が必要です');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/user/consume-diamonds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          diamonds,
          modelId: params.modelId,
          actionType: params.actionType,
          metadata: params.metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'INSUFFICIENT_DIAMONDS') {
          throw new Error(`INSUFFICIENT_DIAMONDS:${data.error}`);
        }
        throw new Error(data.error || 'ダイヤ消費に失敗しました');
      }

      console.log(`[DIAMOND_CONSUME] ${params.actionType} ${params.modelId}: consumed=${diamonds}, remaining=${data.newDiamonds}`);

      return data;

    } catch (error) {
      console.error('Diamond consume error:', error);
      throw error;
    } finally {
      setIsConsuming(false);
    }
  };

  return {
    checkDiamonds,
    consumeDiamonds,
    isChecking,
    isConsuming,
  };
}