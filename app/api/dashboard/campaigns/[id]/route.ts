import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getDashboardCampaignDetailsAdmin } from '@/lib/firestore-admin';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      console.error('Dashboard campaign details auth error:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    const contractorId = decoded.uid;
    const details = await getDashboardCampaignDetailsAdmin(contractorId, id);

    if (!details) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    console.error('Dashboard campaign details error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load campaign details',
      },
      { status: 500 }
    );
  }
}
