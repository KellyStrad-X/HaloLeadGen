import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addPhoto, getCampaignById } from '@/lib/firestore';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;

    // Verify campaign exists
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const photo = formData.get('photo') as File | null;
    const uploadOrder = formData.get('uploadOrder') as string | null;

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo file is required' },
        { status: 400 }
      );
    }

    if (!uploadOrder) {
      return NextResponse.json(
        { error: 'Upload order is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(photo.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (photo.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = photo.name.split('.').pop() || 'jpg';
    const filename = `photo-${uploadOrder}-${timestamp}-${randomStr}.${ext}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, `campaigns/${campaignId}/${filename}`);
    const photoBuffer = await photo.arrayBuffer();
    const uploadResult = await uploadBytes(storageRef, photoBuffer, {
      contentType: photo.type,
    });

    // Get download URL
    const imageUrl = await getDownloadURL(uploadResult.ref);

    // Save photo metadata to Firestore
    const photoId = await addPhoto({
      campaignId,
      imageUrl,
      uploadOrder: parseInt(uploadOrder, 10),
    });

    return NextResponse.json(
      {
        success: true,
        photoId,
        imageUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading photo:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload photo',
      },
      { status: 500 }
    );
  }
}
