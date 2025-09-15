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
      return { canUse: false, reason: 'free_limit' };
    }

    setIsChecking(true);

    try {
      if (user.membershipType === 'free') {
        if (!user.lastUsed) {
          return { canUse: true };
        }

        const daysSinceLastUse = (Date.now() - new Date(user.lastUsed).getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastUse < PRICING.FREE_USER_COOLDOWN_DAYS) {
          const nextAvailableDate = new Date(new Date(user.lastUsed).getTime() + (PRICING.FREE_USER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000));
          return {
            canUse: false,
            reason: 'free_limit',
            nextAvailableDate
          };
        }

        return { canUse: true };
      }

      // 有料会員の場合、ダイヤ残高をチェック
      if (user.membershipType === 'paid') {
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
      }

      return { canUse: false };
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
    if (!user || user.membershipType !== 'paid') {
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
    if (!user || user.membershipType !== 'free') {
      return false;
    }

    try {
      const response = await fetch('/api/user/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_last_used'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating usage for free user:', error);
      return false;
    }
  }, [user]);

  return {
    checkUsageLimit,
    consumeDiamonds,
    updateUsageForFreeUser,
    isChecking
  };
};