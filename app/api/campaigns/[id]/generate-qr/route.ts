import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getCampaignById, updateCampaignQRCode } from '@/lib/firestore';

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
    const filename = `qr-${campaign.pageSlug}.png`;
    const storageRef = ref(storage, `qr-codes/${filename}`);
    const uploadResult = await uploadBytes(storageRef, qrCodeBuffer, {
      contentType: 'image/png',
    });

    // Get download URL
    const qrCodeUrl = await getDownloadURL(uploadResult.ref);

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
