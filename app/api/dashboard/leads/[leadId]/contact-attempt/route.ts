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
    const { contactAttempt, isColdLead } = body;

    if (typeof contactAttempt !== 'number') {
      return NextResponse.json(
        { error: 'contactAttempt must be a number' },
        { status: 400 }
      );
    }

    if (typeof isColdLead !== 'boolean') {
      return NextResponse.json(
        { error: 'isColdLead must be a boolean' },
        { status: 400 }
      );
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

    // Update the lead with contact attempt and cold status
    await leadRef.update({
      contactAttempt,
      isColdLead,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact attempt update error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update contact attempt',
      },
      { status: 500 }
    );
  }
}
