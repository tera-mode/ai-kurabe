import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: credential.cert(serviceAccountKey),
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null;

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe設定が不正です' },
        { status: 500 }
      );
    }

    const { idToken, amount } = await request.json();

    if (!idToken || !amount) {
      return NextResponse.json(
        { error: 'IDトークンと金額が必要です' },
        { status: 400 }
      );
    }

    // Firebase ID Tokenを検証
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // ユーザー情報を取得
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    let customerId = userData?.stripeCustomerId;

    // Stripe顧客が存在しない場合は作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email,
        metadata: {
          firebaseUid: userId,
        },
      });
      customerId = customer.id;

      // Firestore にカスタマーIDを保存
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      });
    }

    // ダイヤ数を計算（¥500 = 5,000ダイヤ）
    const diamonds = Math.floor((amount / 500) * 5000);

    // Stripe決済セッションを作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'AIくらべ ダイヤ',
              description: `${diamonds.toLocaleString()}ダイヤを購入`,
              images: [], // TODO: プロダクト画像を追加する場合
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true&diamonds=${diamonds}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        firebaseUid: userId,
        diamonds: diamonds.toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('決済セッション作成エラー:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `決済セッションの作成に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '決済セッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}