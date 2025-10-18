import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminFirestore } from '@/lib/firebase-admin';

// GET - Load contractor branding
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error('Auth verification error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const db = getAdminFirestore();

    const brandingDoc = await db
      .collection('contractor_branding')
      .doc(userId)
      .get();

    if (!brandingDoc.exists) {
      return NextResponse.json(null);
    }

    return NextResponse.json(brandingDoc.data());
  } catch (error) {
    console.error('Error loading branding:', error);
    return NextResponse.json(
      { error: 'Failed to load branding' },
      { status: 500 }
    );
  }
}

// POST - Save contractor branding
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error('Auth verification error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const data = await request.json();
    const db = getAdminFirestore();

    await db
      .collection('contractor_branding')
      .doc(userId)
      .set(
        {
          ...data,
          userId,
          updatedAt: new Date(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json(
      { error: 'Failed to save branding' },
      { status: 500 }
    );
  }
}
