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
        <h3 className="text-center text-base font-bold text-gray-700 mb-6 tracking-wide drop-shadow-md">
          TRUSTED & CERTIFIED
        </h3>

        {/* 3D Carousel Container - all badges visible in depth layers */}
        <div className="relative h-24 flex items-center justify-center overflow-hidden">
          {/* Render all badges with depth-based positioning */}
          {badges.map((badgeId, index) => {
            // Calculate position relative to current (normalized to 0-5 range)
            let position = (index - currentIndex + badges.length) % badges.length;

            // Map positions to layers with symmetric layout
            let xOffset = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 10;

            if (position === 0) {
              // Front & center
              xOffset = 0;
              scale = 1;
              opacity = 1;
              zIndex = 50;
            } else if (position === 1) {
              // Next up (right)
              xOffset = 110;
              scale = 0.75;
              opacity = 0.6;
              zIndex = 40;
            } else if (position === badges.length - 1) {
              // Previous (left)
              xOffset = -110;
              scale = 0.75;
              opacity = 0.6;
              zIndex = 40;
            } else if (position === 2) {
              // Further right
              xOffset = 160;
              scale = 0.5;
              opacity = 0.3;
              zIndex = 30;
            } else if (position === badges.length - 2) {
              // Further left
              xOffset = -160;
              scale = 0.5;
              opacity = 0.3;
              zIndex = 30;
            } else {
              // Furthest back (center, behind everything)
              xOffset = 0;
              scale = 0.35;
              opacity = 0.15;
              zIndex = 20;
            }

            return (
              <div
                key={`${badgeId}-${index}`}
                className="absolute transition-all duration-700 ease-in-out"
                style={{
                  transform: `translateX(${xOffset}px) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                }}
              >
                <div className={`h-24 w-32 ${position !== 0 ? 'grayscale' : ''}`}>
                  <img
                    src={`/trust-badges/${badgeId}.png`}
                    alt={badgeId.replace(/-/g, ' ')}
                    className={`h-full w-full object-contain ${position === 0 ? 'drop-shadow-lg' : ''}`}
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
