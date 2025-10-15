import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateSlug } from '@/lib/firestore';
import { adminAuth, getAdminFirestore } from '@/lib/firebase-admin';

interface CampaignRequest {
  campaignName: string;
  homeownerName?: string;
  showcaseAddress: string;
  jobStatus: 'Completed' | 'Pending';
}

async function generateUniqueSlugWithAdmin(text: string): Promise<string> {
  const adminDb = getAdminFirestore();
  const baseSlug = generateSlug(text) || 'campaign';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const snapshot = await adminDb
      .collection('campaigns')
      .where('pageSlug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error('Auth verification error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Parse request body
    const body: CampaignRequest = await request.json();

    // Validate required fields
    if (!body.campaignName || !body.showcaseAddress || !body.jobStatus) {
      return NextResponse.json(
        { error: 'Campaign name, address, and job status are required' },
        { status: 400 }
      );
    }

    // Validate job status
    if (body.jobStatus !== 'Completed' && body.jobStatus !== 'Pending') {
      return NextResponse.json(
        { error: 'Job status must be either "Completed" or "Pending"' },
        { status: 400 }
      );
    }

    // Generate unique slug from campaign name (using Admin SDK to bypass client permissions)
    const slug = await generateUniqueSlugWithAdmin(body.campaignName);

    // Create campaign
    const campaignsRef = collection(db, 'campaigns');
    const newCampaign = {
      contractorId: userId,
      campaignName: body.campaignName.trim(),
      homeownerName: body.homeownerName?.trim() || null,
      showcaseAddress: body.showcaseAddress.trim(),
      jobStatus: body.jobStatus,
      campaignStatus: 'Active' as const,
      pageSlug: slug,
      qrCodeUrl: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(campaignsRef, newCampaign);

    console.log('New campaign created:', {
      campaignId: docRef.id,
      contractorId: userId,
      slug,
    });

    return NextResponse.json(
      {
        success: true,
        campaignId: docRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating campaign:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create campaign',
      },
      { status: 500 }
    );
  }
}
