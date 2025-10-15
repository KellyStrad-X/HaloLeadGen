import { NextRequest, NextResponse } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createCampaignAdmin } from '@/lib/firestore-admin';

interface CampaignRequest {
  campaignName: string;
  homeownerName?: string;
  showcaseAddress: string;
  jobStatus: 'Completed' | 'Pending';
}
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
    const body: CampaignRequest = await request.json();

    // Validate required fields
    if (!body.campaignName || !body.showcaseAddress || !body.jobStatus) {
      return NextResponse.json(
        { error: 'Campaign name, address, and job status are required' },
        { status: 400 }
      );
    }

    // Validate job status
    if (body.jobStatus !== 'Completed' && body.jobStatus !== 'Pending') {
      return NextResponse.json(
        { error: 'Job status must be either "Completed" or "Pending"' },
        { status: 400 }
      );
    }

    // Generate unique slug from campaign name (using Admin SDK to bypass client permissions)
    const { id: campaignId, slug } = await createCampaignAdmin({
      contractorId: userId,
      campaignName: body.campaignName,
      homeownerName: body.homeownerName,
      showcaseAddress: body.showcaseAddress,
      jobStatus: body.jobStatus,
    });

    return NextResponse.json(
      {
        success: true,
        campaignId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating campaign:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create campaign',
      },
      { status: 500 }
    );
  }
}
