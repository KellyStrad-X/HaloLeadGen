import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getDashboardCampaignsAdmin } from '@/lib/firestore-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decoded;

    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Dashboard campaigns auth error:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    const contractorId = decoded.uid;
    const campaigns = await getDashboardCampaignsAdmin(contractorId);

    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error('Dashboard campaigns error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load campaigns',
      },
      { status: 500 }
    );
  }
}
