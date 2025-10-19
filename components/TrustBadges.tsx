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
    <>
      <style jsx>{`
        .badge-position-1 { --x-offset: 85px; }
        .badge-position--1 { --x-offset: -85px; }
        .badge-position-2 { --x-offset: 130px; }
        .badge-position--2 { --x-offset: -130px; }

        @media (min-width: 768px) {
          .badge-position-1 { --x-offset: 110px; }
          .badge-position--1 { --x-offset: -110px; }
          .badge-position-2 { --x-offset: 170px; }
          .badge-position--2 { --x-offset: -170px; }
        }
      `}</style>
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
            let positionClass = '';
            let scale = 1;
            let opacity = 1;
            let zIndex = 10;
            let useCustomOffset = false;

            if (position === 0) {
              // Front & center
              positionClass = '';
              scale = 1;
              opacity = 1;
              zIndex = 50;
            } else if (position === 1) {
              // Next up (right)
              positionClass = 'badge-position-1';
              useCustomOffset = true;
              scale = 0.75;
              opacity = 0.6;
              zIndex = 40;
            } else if (position === badges.length - 1) {
              // Previous (left)
              positionClass = 'badge-position--1';
              useCustomOffset = true;
              scale = 0.75;
              opacity = 0.6;
              zIndex = 40;
            } else if (position === 2) {
              // Further right
              positionClass = 'badge-position-2';
              useCustomOffset = true;
              scale = 0.5;
              opacity = 0.3;
              zIndex = 30;
            } else if (position === badges.length - 2) {
              // Further left
              positionClass = 'badge-position--2';
              useCustomOffset = true;
              scale = 0.5;
              opacity = 0.3;
              zIndex = 30;
            } else {
              // Furthest back (center, behind everything) - virtually invisible
              positionClass = '';
              scale = 0.35;
              opacity = 0.05;
              zIndex = 20;
            }

            return (
              <div
                key={`${badgeId}-${index}`}
                className={`absolute transition-all duration-700 ease-in-out ${positionClass}`}
                style={{
                  transform: useCustomOffset ? `translateX(var(--x-offset)) scale(${scale})` : `scale(${scale})`,
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
    </>
  );
}
