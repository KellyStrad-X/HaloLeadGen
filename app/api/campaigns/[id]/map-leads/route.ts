import { NextRequest, NextResponse } from 'next/server';
import { getLeadsForCampaignMap } from '@/lib/firestore-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Fetch consented leads with approximate locations
    const leads = await getLeadsForCampaignMap(campaignId);

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching map leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map leads' },
      { status: 500 }
    );
  }
}
