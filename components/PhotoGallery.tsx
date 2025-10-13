'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type Photo } from '@/lib/db';

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedPhoto(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = 'unset';
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhoto === null) return;

    if (direction === 'prev') {
      setSelectedPhoto(selectedPhoto > 0 ? selectedPhoto - 1 : photos.length - 1);
    } else {
      setSelectedPhoto(selectedPhoto < photos.length - 1 ? selectedPhoto + 1 : 0);
    }
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="relative aspect-video overflow-hidden rounded-lg bg-halo-dark-light border border-halo-medium/30 hover:border-halo-ice/50 transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
            <div className="absolute bottom-3 left-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white text-sm font-medium">Click to enlarge</p>
            </div>
            {/* Placeholder for now - will be replaced with actual images */}
            <div className="absolute inset-0 flex items-center justify-center bg-halo-dark-light">
              <div className="text-center">
                <div className="text-halo-ice text-4xl mb-2">📷</div>
                <p className="text-halo-medium text-sm">Photo {index + 1}</p>
                <p className="text-halo-medium text-xs mt-1">
                  {photo.image_path.split('/').pop()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-halo-ice transition-colors p-2"
            aria-label="Close"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Previous button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigatePhoto('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-halo-ice transition-colors p-2"
            aria-label="Previous photo"
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Next button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigatePhoto('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-halo-ice transition-colors p-2"
            aria-label="Next photo"
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Photo */}
          <div
            className="max-w-6xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Placeholder for actual image */}
            <div className="bg-halo-dark border border-halo-ice/30 rounded-lg p-12 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-halo-ice text-6xl mb-4">📷</div>
                <p className="text-white text-xl font-medium mb-2">
                  Photo {selectedPhoto + 1} of {photos.length}
                </p>
                <p className="text-halo-medium">
                  {photos[selectedPhoto].image_path.split('/').pop()}
                </p>
                <p className="text-halo-medium text-sm mt-4">
                  Actual photos will be loaded from the uploads folder
                </p>
              </div>
            </div>

            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-white text-sm">
                {selectedPhoto + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
