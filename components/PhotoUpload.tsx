'use client';

import { useState, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface PhotoUploadProps {
  campaignId: string;
  onUploadComplete: (photoUrls: string[]) => void;
  onSuccess?: () => void;
}

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

export default function PhotoUpload({
  campaignId,
  onUploadComplete,
  onSuccess,
}: PhotoUploadProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  // Add files with validation
  const addFiles = (files: File[]) => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 50 * 1024 * 1024; // 50MB

    const validFiles = files.filter((file) => {
      if (!validImageTypes.includes(file.type)) {
        setError(`${file.name} is not a supported image type`);
        return false;
      }
      if (file.size > maxFileSize) {
        setError(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    const newPhotos: PhotoFile[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    setError(null);
  };

  // Remove photo
  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Move photo up in order
  const movePhotoUp = (index: number) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      [newPhotos[index - 1], newPhotos[index]] = [
        newPhotos[index],
        newPhotos[index - 1],
      ];
      return newPhotos;
    });
  };

  // Move photo down in order
  const movePhotoDown = (index: number) => {
    if (index === photos.length - 1) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      [newPhotos[index], newPhotos[index + 1]] = [
        newPhotos[index + 1],
        newPhotos[index],
      ];
      return newPhotos;
    });
  };

  // Upload photos
  const handleUpload = async () => {
    if (photos.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (!user) {
        setError('You must be signed in to upload photos');
        setIsUploading(false);
        return;
      }

      const token = await user.getIdToken();

      // Upload photos one by one to show progress
      const uploadedUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const formData = new FormData();
        formData.append('photo', photos[i].file);
        formData.append('uploadOrder', (i + 1).toString());

        const response = await fetch(`/api/campaigns/${campaignId}/photos`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload photo');
        }

        const data = await response.json();
        uploadedUrls.push(data.imageUrl);

        // Update progress
        setUploadProgress(Math.round(((i + 1) / photos.length) * 100));
      }

      // Generate QR code
      const qrResponse = await fetch(`/api/campaigns/${campaignId}/generate-qr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!qrResponse.ok) {
        throw new Error('Failed to generate QR code');
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to success page
      router.push(`/campaign/${campaignId}/success`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-halo-ice bg-halo-ice/10'
            : 'border-[#444c56] hover:border-halo-medium'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="text-halo-ice text-5xl">📸</div>
          <div>
            <p className="text-lg font-semibold text-white mb-2">
              {isDragging ? 'Drop photos here' : 'Drop photos or click to browse'}
            </p>
            <p className="text-sm text-halo-medium">
              Supports JPG, PNG, WebP • Max 50MB per file
            </p>
            <p className="text-xs text-halo-medium mt-1">
              Upload as many photos as you need (10+ recommended)
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Selected Photos ({photos.length})
            </h3>
            <button
              type="button"
              onClick={() => setPhotos([])}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Remove All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative bg-[#1e2227] border border-[#444c56] rounded-lg overflow-hidden group"
              >
                {/* Order number */}
                <div className="absolute top-2 left-2 w-8 h-8 bg-halo-ice text-black font-bold rounded-full flex items-center justify-center text-sm z-10">
                  {index + 1}
                </div>

                {/* Image preview */}
                <img
                  src={photo.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />

                {/* File info */}
                <div className="p-2">
                  <p className="text-xs text-halo-light truncate">
                    {photo.file.name}
                  </p>
                  <p className="text-xs text-halo-medium">
                    {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Hover controls */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => movePhotoUp(index)}
                      className="p-2 bg-halo-ice text-black rounded-lg hover:bg-halo-ice/90"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => movePhotoDown(index)}
                      className="p-2 bg-halo-ice text-black rounded-lg hover:bg-halo-ice/90"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-halo-light">Uploading photos...</span>
            <span className="text-halo-ice font-semibold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-[#1e2227] rounded-full overflow-hidden">
            <div
              className="h-full bg-halo-ice transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={photos.length === 0 || isUploading}
        className="w-full px-6 py-4 bg-halo-ice text-black font-semibold rounded-lg hover:bg-halo-ice/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading
          ? 'Uploading...'
          : `Upload ${photos.length} Photo${photos.length !== 1 ? 's' : ''}`}
      </button>

      {photos.length === 0 && (
        <p className="text-center text-sm text-halo-medium">
          At least 1 photo required • 10+ photos recommended for best results
        </p>
      )}
    </div>
  );
}
