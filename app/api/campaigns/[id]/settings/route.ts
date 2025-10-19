import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { updateCampaignSettingsAdmin } from '@/lib/firestore-admin';
import { getAdminApp } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const adminApp = getAdminApp();
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);

    if (!decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceRadiusMiles, campaignStatus } = body;

    // Validate inputs
    if (serviceRadiusMiles !== undefined) {
      const validRadii = [3, 5, 10, 15];
      if (!validRadii.includes(serviceRadiusMiles)) {
        return NextResponse.json(
          { error: 'Invalid service radius' },
          { status: 400 }
        );
      }
    }

    if (campaignStatus !== undefined) {
      const validStatuses = ['Active', 'Inactive'];
      if (!validStatuses.includes(campaignStatus)) {
        return NextResponse.json(
          { error: 'Invalid campaign status' },
          { status: 400 }
        );
      }
    }

    const campaign = await updateCampaignSettingsAdmin({
      campaignId,
      contractorId: decodedToken.uid,
      serviceRadiusMiles,
      campaignStatus,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error updating campaign settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
