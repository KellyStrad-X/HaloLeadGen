import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { updateJobAdmin, type LeadJobStatus } from '@/lib/firestore-admin';

function parseDate(value: unknown): Date | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return undefined;
}

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
    const { status, scheduledInspectionDate, inspector, internalNotes } = body ?? {};

    let jobStatus: LeadJobStatus | undefined;
    if (typeof status !== 'undefined') {
      if (!['scheduled', 'in_progress', 'completed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid job status' },
          { status: 400 }
        );
      }
      jobStatus = status as LeadJobStatus;
    }

    const parsedDate = parseDate(scheduledInspectionDate);
    if (scheduledInspectionDate && typeof parsedDate === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid scheduledInspectionDate' },
        { status: 400 }
      );
    }

    const job = await updateJobAdmin({
      leadId,
      contractorId: decoded.uid,
      status: jobStatus,
      scheduledInspectionDate: parsedDate === undefined ? undefined : parsedDate,
      inspector:
        typeof inspector === 'string' ? inspector.trim() || null : undefined,
      internalNotes:
        typeof internalNotes === 'string'
          ? internalNotes.trim() || null
          : undefined,
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Dashboard jobs PATCH error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update job',
      },
      { status: 500 }
    );
  }
}

