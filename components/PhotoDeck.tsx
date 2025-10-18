'use client';

import { useState } from 'react';

interface Photo {
  id: string;
  imageUrl: string;
}

interface PhotoDeckProps {
  photos: Photo[];
}

export default function PhotoDeck({ photos }: PhotoDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }

    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleTapZone = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Left third = previous, right third = next
    if (x < width / 3) {
      handlePrevious();
    } else if (x > (width * 2) / 3) {
      handleNext();
    }
    // Middle third does nothing (could open modal in future)
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Photo Deck Container */}
      <div
        className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden shadow-xl cursor-pointer select-none group"
        onClick={handleTapZone}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Current Photo */}
        <img
          src={photos[currentIndex].imageUrl}
          alt={`Photo ${currentIndex + 1} of ${photos.length}`}
          className="w-full h-full object-contain"
        />

        {/* Tap Zone Indicators (visible on hover) */}
        <div className="absolute inset-0 flex">
          {/* Left Zone */}
          <div className="flex-1 flex items-center justify-start pl-4 hover:bg-black/20 transition-colors">
            <div className="hidden md:block bg-black/50 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>

          {/* Middle Zone (no action) */}
          <div className="flex-1"></div>

          {/* Right Zone */}
          <div className="flex-1 flex items-center justify-end pr-4 hover:bg-black/20 transition-colors">
            <div className="hidden md:block bg-black/50 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Photo Counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Navigation Arrows (Mobile/Touch) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:hidden transition-colors"
          aria-label="Previous photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:hidden transition-colors"
          aria-label="Next photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-gray-900'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to photo ${index + 1}`}
          />
        ))}
      </div>

      {/* Instructions (subtle) */}
      <p className="text-center text-sm text-gray-500 mt-3">
        <span className="hidden md:inline">Click left or right to navigate • </span>
        <span className="md:hidden">Swipe or tap to navigate • </span>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
      </p>
    </div>
  );
}
