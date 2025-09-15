import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
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
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe設定が不正です' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Stripeシグネチャが見つかりません' },
      { status: 400 }
    );
  }

  try {
    // Webhookイベントを検証
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // メタデータからFirebase UIDとダイヤ数を取得
        const firebaseUid = session.metadata?.firebaseUid;
        const diamonds = parseInt(session.metadata?.diamonds || '0');

        if (!firebaseUid || !diamonds) {
          console.error('必要なメタデータが不足しています:', session.metadata);
          return NextResponse.json(
            { error: 'メタデータが不足しています' },
            { status: 400 }
          );
        }

        // ユーザードキュメントを取得
        const userDocRef = db.collection('users').doc(firebaseUid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          console.error('ユーザーが見つかりません:', firebaseUid);
          return NextResponse.json(
            { error: 'ユーザーが見つかりません' },
            { status: 404 }
          );
        }

        const userData = userDoc.data()!;
        const currentDiamonds = userData.diamonds || 0;

        // ダイヤを追加し、membershipTypeをpaidに変更
        await userDocRef.update({
          diamonds: currentDiamonds + diamonds,
          membershipType: 'paid',
          updatedAt: new Date(),
        });

        // トランザクション記録を作成
        const transactionData = {
          userId: firebaseUid,
          type: 'diamond_purchase',
          amount: session.amount_total! / 100, // セント → 円
          diamonds: diamonds,
          stripeSessionId: session.id,
          stripePaymentStatus: session.payment_status,
          createdAt: new Date(),
        };

        await db.collection('transactions').add(transactionData);

        console.log(`ダイヤ購入完了: User ${firebaseUid} に ${diamonds} ダイヤを追加`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('決済セッションが期限切れになりました:', session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('決済が失敗しました:', paymentIntent.id);
        break;
      }

      default:
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhookエラー:', error);

    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json(
        { error: 'Webhook署名検証に失敗しました' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook処理に失敗しました' },
      { status: 500 }
    );
  }
}