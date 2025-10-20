import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import {
  getJobsByStatusAdmin,
  promoteLeadToJobAdmin,
  type LeadJobStatus,
} from '@/lib/firestore-admin';

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

export async function GET(request: NextRequest) {
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

    const jobs = await getJobsByStatusAdmin(decoded.uid);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Dashboard jobs GET error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load jobs',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { leadId, status, scheduledInspectionDate, inspector, internalNotes } = body ?? {};

    if (!leadId || typeof leadId !== 'string') {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    let jobStatus: LeadJobStatus = 'scheduled';
    if (status) {
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

    const job = await promoteLeadToJobAdmin({
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
        { error: 'Unable to promote lead to job' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Dashboard jobs POST error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to promote lead to job',
      },
      { status: 500 }
    );
  }
}
