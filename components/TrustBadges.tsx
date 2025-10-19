'use client';

import { useState, useEffect } from 'react';

interface TrustBadgesProps {
  badges: string[];
}

export default function TrustBadges({ badges }: TrustBadgesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!badges || badges.length === 0) {
    return null;
  }

  // If only 1-2 badges, show static display
  if (badges.length <= 2) {
    return (
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-center text-sm font-semibold text-gray-600 mb-6 tracking-wide">
            TRUSTED & CERTIFIED
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {badges.map((badgeId) => (
              <div key={badgeId} className="h-16 w-24 flex-shrink-0">
                <img
                  src={`/trust-badges/${badgeId}.png`}
                  alt={badgeId.replace(/-/g, ' ')}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Auto-rotate every 4 seconds for 3+ badges
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % badges.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [badges.length]);

  // Helper to get badge at relative position
  const getBadgeAtPosition = (offset: number) => {
    const index = (currentIndex + offset + badges.length) % badges.length;
    return badges[index];
  };

  const prevBadge = getBadgeAtPosition(-1);
  const centerBadge = getBadgeAtPosition(0);
  const nextBadge = getBadgeAtPosition(1);

  return (
    <section className="py-8 bg-gray-50 border-y border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-center text-sm font-semibold text-gray-600 mb-6 tracking-wide">
          TRUSTED & CERTIFIED
        </h3>

        {/* 3D Carousel Container */}
        <div className="relative h-24 flex items-center justify-center">
          {/* Previous badge (left, behind) */}
          <div className="absolute left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out"
               style={{ transform: 'translateX(-200px) translateZ(-100px) scale(0.7)', zIndex: 1 }}>
            <div className="h-20 w-28 opacity-50 grayscale">
              <img
                src={`/trust-badges/${prevBadge}.png`}
                alt={prevBadge.replace(/-/g, ' ')}
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Center badge (front, full color) */}
          <div className="absolute left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out"
               style={{ transform: 'translateX(0) translateZ(0) scale(1)', zIndex: 10 }}>
            <div className="h-24 w-32">
              <img
                src={`/trust-badges/${centerBadge}.png`}
                alt={centerBadge.replace(/-/g, ' ')}
                className="h-full w-full object-contain drop-shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Next badge (right, behind) */}
          <div className="absolute left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out"
               style={{ transform: 'translateX(200px) translateZ(-100px) scale(0.7)', zIndex: 1 }}>
            <div className="h-20 w-28 opacity-50 grayscale">
              <img
                src={`/trust-badges/${nextBadge}.png`}
                alt={nextBadge.replace(/-/g, ' ')}
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          {badges.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-gray-900'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to badge ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
