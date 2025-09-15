'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { UsageLimit, PRICING } from '@/types';

export const useUsageLimit = () => {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkUsageLimit = useCallback(async (
    estimatedTokens?: number,
    estimatedImages?: number
  ): Promise<UsageLimit> => {
    if (!user) {
      return { canUse: false, reason: 'insufficient_diamonds' };
    }

    setIsChecking(true);

    try {
      // ダイヤ残高をチェック
      let requiredDiamonds = 0;

      if (estimatedTokens) {
        requiredDiamonds += estimatedTokens * 0.1; // 仮の値
      }

      if (estimatedImages) {
        requiredDiamonds += estimatedImages * 50; // 仮の値
      }

      requiredDiamonds = Math.max(requiredDiamonds, PRICING.MINIMUM_CONSUMPTION);

      if (user.diamonds < requiredDiamonds) {
        return {
          canUse: false,
          reason: 'insufficient_diamonds',
          requiredDiamonds
        };
      }

      return { canUse: true };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { canUse: false };
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  const consumeDiamonds = useCallback(async (
    tokens?: number,
    images?: number,
    description?: string
  ): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      let consumedDiamonds = 0;

      if (tokens) {
        consumedDiamonds += tokens * 0.1; // 仮の値
      }

      if (images) {
        consumedDiamonds += images * 50; // 仮の値
      }

      consumedDiamonds = Math.max(consumedDiamonds, PRICING.MINIMUM_CONSUMPTION);

      if (user.diamonds < consumedDiamonds) {
        return false;
      }

      // API呼び出しでダイヤを消費
      const response = await fetch('/api/user/diamonds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'consume',
          amount: consumedDiamonds,
          description: description || 'AI使用料',
          metadata: { tokens, images }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to consume diamonds');
      }

      return true;
    } catch (error) {
      console.error('Error consuming diamonds:', error);
      return false;
    }
  }, [user]);

  const updateUsageForFreeUser = useCallback(async (): Promise<boolean> => {
    // 7日制限廃止により、この関数は不要になったが互換性のため残す
    return true;
  }, [user]);

  return {
    checkUsageLimit,
    consumeDiamonds,
    updateUsageForFreeUser,
    isChecking
  };
};