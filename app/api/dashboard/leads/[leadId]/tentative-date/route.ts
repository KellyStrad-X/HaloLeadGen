import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminFirestore } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const { leadId } = await params;
    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tentativeDate } = body;

    // Validate tentativeDate is either null or a valid ISO date string
    if (tentativeDate !== null && typeof tentativeDate !== 'string') {
      return NextResponse.json(
        { error: 'tentativeDate must be a string or null' },
        { status: 400 }
      );
    }

    if (tentativeDate !== null) {
      // Validate it's a valid date format
      const dateObj = new Date(tentativeDate);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { error: 'tentativeDate must be a valid ISO date string' },
          { status: 400 }
        );
      }
    }

    const db = getAdminFirestore();
    const leadRef = db.collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();

    if (!leadDoc.exists) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const leadData = leadDoc.data();

    // Verify the lead belongs to a campaign owned by this contractor
    if (!leadData?.campaignId) {
      return NextResponse.json(
        { error: 'Invalid lead data' },
        { status: 400 }
      );
    }

    const campaignDoc = await db.collection('campaigns').doc(leadData.campaignId).get();
    if (!campaignDoc.exists || campaignDoc.data()?.contractorId !== decoded.uid) {
      return NextResponse.json(
        { error: 'Unauthorized - Lead does not belong to your campaigns' },
        { status: 403 }
      );
    }

    // Update the lead with tentative date
    await leadRef.update({
      tentativeDate,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tentative date update error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update tentative date',
      },
      { status: 500 }
    );
  }
}
