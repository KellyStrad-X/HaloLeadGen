'use client';

import { useState, useEffect } from 'react';

const HERO_PHOTOS = [
  '/campaign-hero-photos/1.jpg',
  '/campaign-hero-photos/2.jpg',
  '/campaign-hero-photos/3.jpg',
  '/campaign-hero-photos/4.jpg',
  '/campaign-hero-photos/5.jpg',
];

const AUTO_ADVANCE_INTERVAL = 5000; // 5 seconds

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_PHOTOS.length);
    }, AUTO_ADVANCE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden rounded-lg shadow-lg">
      {/* Photos */}
      {HERO_PHOTOS.map((photo, index) => (
        <div
          key={photo}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={photo}
            alt={`Home ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        </div>
      ))}

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {HERO_PHOTOS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
