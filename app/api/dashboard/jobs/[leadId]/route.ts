import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { updateJobAdmin, unscheduleJobAdmin, markJobAsColdAdmin, type LeadJobStatus } from '@/lib/firestore-admin';

function parseDate(value: unknown): Date | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    // Parse YYYY-MM-DD strings as local noon to avoid timezone shift
    const dateStr = value.trim();
    const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
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
      if (!['scheduled', 'completed'].includes(status)) {
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

export async function DELETE(
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

    // Check query param for action type
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'mark-cold') {
      // Mark job as cold lead
      const success = await markJobAsColdAdmin({
        leadId,
        contractorId: decoded.uid,
      });

      if (!success) {
        return NextResponse.json(
          { error: 'Job not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, message: 'Job marked as cold lead' });
    } else {
      // Default: unschedule job (convert back to active lead)
      const success = await unscheduleJobAdmin({
        leadId,
        contractorId: decoded.uid,
      });

      if (!success) {
        return NextResponse.json(
          { error: 'Job not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, message: 'Job unscheduled' });
    }
  } catch (error) {
    console.error('Dashboard jobs DELETE error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete job',
      },
      { status: 500 }
    );
  }
}

