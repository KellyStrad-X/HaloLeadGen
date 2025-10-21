import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { restoreColdLeadAdmin } from '@/lib/firestore-admin';

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

    const success = await restoreColdLeadAdmin({
      leadId,
      contractorId: decoded.uid,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Lead not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Lead restored from cold bucket' });
  } catch (error) {
    console.error('Restore cold lead error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to restore cold lead',
      },
      { status: 500 }
    );
  }
}
