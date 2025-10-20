import { NextRequest, NextResponse } from 'next/server';
import { getCompletedCampaignLocationsByCampaignIdAdmin } from '@/lib/firestore-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const locations = await getCompletedCampaignLocationsByCampaignIdAdmin(
      campaignId
    );

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error fetching completed campaign locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign locations' },
      { status: 500 }
    );
  }
}
