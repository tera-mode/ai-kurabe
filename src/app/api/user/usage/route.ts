import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { PRICING } from '@/types';

export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase configuration error' }, { status: 500 });
    }

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { action } = body;

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();

    if (action === 'update_last_used') {
      // 無料ユーザーの最終利用日を更新
      if (userData?.membershipType === 'free') {
        await userRef.update({
          lastUsed: new Date(),
          updatedAt: new Date()
        });

        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: 'Not a free user' }, { status: 400 });
    }

    if (action === 'check_limit') {
      // 利用制限をチェック
      if (userData?.membershipType === 'free') {
        if (!userData?.lastUsed) {
          return NextResponse.json({ canUse: true });
        }

        const lastUsedDate = userData?.lastUsed?.toDate?.();
        if (!lastUsedDate) {
          return NextResponse.json({ canUse: true });
        }

        const daysSinceLastUse = (Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastUse < PRICING.FREE_USER_COOLDOWN_DAYS) {
          const nextAvailableDate = new Date(lastUsedDate.getTime() + (PRICING.FREE_USER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000));
          return NextResponse.json({
            canUse: false,
            reason: 'free_limit',
            nextAvailableDate
          });
        }

        return NextResponse.json({ canUse: true });
      }

      // 有料会員の場合はダイヤ残高をチェック
      if (userData?.membershipType === 'paid') {
        const { estimatedTokens, estimatedImages } = body;
        let requiredDiamonds = 0;

        if (estimatedTokens) {
          requiredDiamonds += estimatedTokens * 0.1; // 仮の値
        }

        if (estimatedImages) {
          requiredDiamonds += estimatedImages * 50; // 仮の値
        }

        requiredDiamonds = Math.max(requiredDiamonds, PRICING.MINIMUM_CONSUMPTION);

        const currentDiamonds = userData?.diamonds || 0;
        if (currentDiamonds < requiredDiamonds) {
          return NextResponse.json({
            canUse: false,
            reason: 'insufficient_diamonds',
            requiredDiamonds
          });
        }

        return NextResponse.json({ canUse: true });
      }

      return NextResponse.json({ canUse: false });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing user usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}