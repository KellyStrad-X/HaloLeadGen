import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { getCampaignById, updateCampaignQRCode } from '@/lib/firestore';
import { getAdminStorage } from '@/lib/firebase-admin';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;

    // Get campaign
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
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
    await updateCampaignQRCode(campaignId, qrCodeUrl);

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
