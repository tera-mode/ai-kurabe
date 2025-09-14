import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { doc, getDoc, updateDoc, serverTimestamp as adminServerTimestamp, collection, addDoc } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { action, amount, description, metadata } = body;

    if (action === 'consume') {
      // ダイヤを消費する
      const userRef = doc(adminDb, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userSnap.data();
      const currentDiamonds = userData.diamonds || 0;

      if (currentDiamonds < amount) {
        return NextResponse.json({ error: 'Insufficient diamonds' }, { status: 400 });
      }

      // ユーザーのダイヤを減らす
      await updateDoc(userRef, {
        diamonds: currentDiamonds - amount,
        updatedAt: adminServerTimestamp()
      });

      // トランザクション記録を追加
      await addDoc(collection(adminDb, 'transactions'), {
        uid,
        type: 'usage',
        amount: -amount,
        description: description || 'AI使用料',
        metadata: metadata || {},
        createdAt: adminServerTimestamp()
      });

      return NextResponse.json({
        success: true,
        remainingDiamonds: currentDiamonds - amount
      });
    }

    if (action === 'purchase') {
      // ダイヤを追加する（Stripe決済後に呼ばれる）
      const userRef = doc(adminDb, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userSnap.data();
      const currentDiamonds = userData.diamonds || 0;

      await updateDoc(userRef, {
        diamonds: currentDiamonds + amount,
        membershipType: 'paid',
        updatedAt: adminServerTimestamp()
      });

      // トランザクション記録を追加
      await addDoc(collection(adminDb, 'transactions'), {
        uid,
        type: 'purchase',
        amount: amount,
        description: description || 'ダイヤ購入',
        metadata: metadata || {},
        createdAt: adminServerTimestamp()
      });

      return NextResponse.json({
        success: true,
        totalDiamonds: currentDiamonds + amount
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing diamonds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userRef = doc(adminDb, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    return NextResponse.json({
      diamonds: userData.diamonds || 0,
      membershipType: userData.membershipType || 'free'
    });
  } catch (error) {
    console.error('Error getting user diamonds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}