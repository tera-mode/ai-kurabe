import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'パスワードが必要です' },
        { status: 400 }
      );
    }

    // 環境変数から管理者パスワードを取得
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('[ADMIN_AUTH] ADMIN_PASSWORD not configured');
      return NextResponse.json(
        { error: 'システム設定エラー' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      console.log(`[ADMIN_AUTH] Invalid password attempt from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { error: 'パスワードが間違っています' },
        { status: 401 }
      );
    }

    // セッション用のトークンを生成（簡易的な実装）
    const sessionToken = Buffer.from(
      `admin_session_${Date.now()}_${Math.random()}`
    ).toString('base64');

    // HTTPOnly Cookieでセッションを保存（24時間有効）
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24時間
      path: '/'
    });

    console.log(`[ADMIN_AUTH] Admin login successful from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[ADMIN_AUTH] Error:', error);
    return NextResponse.json(
      { error: '認証処理に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session');

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    // セッションの有効性をチェック（簡易的）
    const isValid = sessionToken.value && sessionToken.value.startsWith('YWRtaW5fc2Vzc2lvbl8'); // 'admin_session_'のbase64

    return NextResponse.json({ authenticated: isValid });

  } catch (error) {
    console.error('[ADMIN_AUTH_CHECK] Error:', error);
    return NextResponse.json({ authenticated: false });
  }
}