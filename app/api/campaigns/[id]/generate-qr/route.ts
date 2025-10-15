import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { adminAuth, getAdminStorage } from '@/lib/firebase-admin';
import {
  getCampaignByIdAdmin,
  updateCampaignQRCodeAdmin,
} from '@/lib/firestore-admin';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;

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
      console.error('Auth verification error (QR generate):', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    // Get campaign
    const campaign = await getCampaignByIdAdmin(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.contractorId !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this campaign' },
        { status: 403 }
      );
    }

    // Construct landing page URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const landingPageUrl = `${baseUrl}/c/${campaign.pageSlug}`;

    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(landingPageUrl, {
      type: 'png',
      width: 1024, // High resolution for printing
      margin: 4, // White space around QR
      errorCorrectionLevel: 'H', // High error correction
      color: {
        dark: '#000000', // Black
        light: '#FFFFFF', // White
      },
    });

    // Upload QR code to Firebase Storage
    const adminStorage = getAdminStorage();
    const filename = `qr-${campaign.pageSlug}.png`;
    const objectPath = `qr-codes/${filename}`;
    const downloadToken = randomUUID();
    const file = adminStorage.file(objectPath);

    await file.save(qrCodeBuffer, {
      resumable: false,
      metadata: {
        contentType: 'image/png',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const qrCodeUrl = `https://firebasestorage.googleapis.com/v0/b/${adminStorage.name}/o/${encodeURIComponent(
      objectPath
    )}?alt=media&token=${downloadToken}`;

    // Update campaign with QR code URL
    await updateCampaignQRCodeAdmin(campaignId, qrCodeUrl);

    console.log('QR code generated:', {
      campaignId,
      slug: campaign.pageSlug,
      url: landingPageUrl,
    });

    return NextResponse.json(
      {
        success: true,
        qrCodeUrl,
        landingPageUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating QR code:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate QR code',
      },
      { status: 500 }
    );
  }
}
