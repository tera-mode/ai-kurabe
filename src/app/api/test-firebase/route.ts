import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Test Firebase Admin connection by creating a test document
    const testCollection = adminDb.collection('test');
    const testDoc = testCollection.doc('connection-test');
    
    await testDoc.set({
      timestamp: new Date(),
      message: 'Firebase connection successful',
      environment: 'development'
    });

    // Read the document back to verify
    const docSnapshot = await testDoc.get();
    const data = docSnapshot.data();

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK connected successfully',
      data: data,
      projectId: 'ai-kurabe'
    });
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to Firebase'
      },
      { status: 500 }
    );
  }
}