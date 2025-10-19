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

  return (
    <section className="py-8 bg-gray-50 border-y border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-center text-sm font-semibold text-gray-600 mb-6 tracking-wide">
          TRUSTED & CERTIFIED
        </h3>

        {/* 3D Carousel Container - centered with minimal spacing */}
        <div className="relative h-24 flex items-center justify-center overflow-hidden">
          {/* Render all badges with positioning based on their relation to currentIndex */}
          {badges.map((badgeId, index) => {
            const position = (index - currentIndex + badges.length) % badges.length;
            const isCenter = position === 0;
            const isPrev = position === badges.length - 1;
            const isNext = position === 1;

            // Only show prev, center, and next
            if (!isCenter && !isPrev && !isNext) return null;

            let xOffset = 0;
            let scale = 0.7;
            let opacity = 0.5;
            let zIndex = 1;

            if (isCenter) {
              xOffset = 0;
              scale = 1;
              opacity = 1;
              zIndex = 10;
            } else if (isPrev) {
              xOffset = -110; // Minimal spacing
              scale = 0.7;
              opacity = 0.5;
              zIndex = 1;
            } else if (isNext) {
              xOffset = 110; // Minimal spacing
              scale = 0.7;
              opacity = 0.5;
              zIndex = 1;
            }

            return (
              <div
                key={badgeId}
                className="absolute transition-all duration-700 ease-in-out"
                style={{
                  transform: `translateX(${xOffset}px) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                }}
              >
                <div className={`h-24 w-32 ${!isCenter ? 'grayscale' : ''}`}>
                  <img
                    src={`/trust-badges/${badgeId}.png`}
                    alt={badgeId.replace(/-/g, ' ')}
                    className={`h-full w-full object-contain ${isCenter ? 'drop-shadow-lg' : ''}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
