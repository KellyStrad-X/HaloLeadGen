import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { adminAuth, getAdminStorage } from '@/lib/firebase-admin';

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
      console.error('Auth verification error (upload):', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'logo' or 'team-photo'

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!type || !['logo', 'team-photo'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "logo" or "team-photo"' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max for logos/team photos)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${type}-${timestamp}-${randomStr}.${ext}`;

    // Upload to Firebase Storage using admin SDK
    const adminStorage = getAdminStorage();
    const objectPath = `contractor-branding/${userId}/${filename}`;
    const storageFile = adminStorage.file(objectPath);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const downloadToken = randomUUID();

    await storageFile.save(fileBuffer, {
      resumable: false,
      metadata: {
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${adminStorage.name}/o/${encodeURIComponent(
      objectPath
    )}?alt=media&token=${downloadToken}`;

    return NextResponse.json(
      {
        success: true,
        imageUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}
