import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getAllLeadsAdmin } from '@/lib/firestore-admin';

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
      console.error('Dashboard leads auth error:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    const contractorId = decoded.uid;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || undefined;
    const jobStatus = searchParams.get('jobStatus') as 'new' | 'contacted' | 'scheduled' | 'completed' | undefined;

    const filters: { campaignId?: string; jobStatus?: 'new' | 'contacted' | 'scheduled' | 'completed' } = {};
    if (campaignId) filters.campaignId = campaignId;
    if (jobStatus) filters.jobStatus = jobStatus;

    const leads = await getAllLeadsAdmin(contractorId, filters);

    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error('Dashboard leads error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load leads',
      },
      { status: 500 }
    );
  }
}
