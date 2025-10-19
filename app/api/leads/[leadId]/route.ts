import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getLeadByIdAdmin, updateLeadStatusAdmin } from '@/lib/firestore-admin';
import { getAdminApp } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;
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

    const lead = await getLeadByIdAdmin(leadId, decodedToken.uid);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;
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
    const { jobStatus, contractorNotes } = body;

    // Validate jobStatus if provided
    const validStatuses = ['new', 'contacted', 'scheduled', 'completed'];
    if (jobStatus && !validStatuses.includes(jobStatus)) {
      return NextResponse.json(
        { error: 'Invalid job status' },
        { status: 400 }
      );
    }

    const lead = await updateLeadStatusAdmin({
      leadId,
      contractorId: decodedToken.uid,
      jobStatus,
      contractorNotes,
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
