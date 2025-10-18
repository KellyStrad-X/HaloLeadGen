'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const HERO_PHOTOS = [
  '/campaign-hero-photos/1.png',
  '/campaign-hero-photos/2.png',
  '/campaign-hero-photos/3.png',
  '/campaign-hero-photos/4.png',
  '/campaign-hero-photos/5.png',
];

const AUTO_ADVANCE_INTERVAL = 5000; // 5 seconds

interface HeroCarouselProps {
  children: React.ReactNode;
}

export default function CampaignHero({ children }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_PHOTOS.length);
    }, AUTO_ADVANCE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-white text-gray-900 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[600px] sm:min-h-[700px]">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {HERO_PHOTOS.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`Home ${index + 1}`}
              fill
              className="object-cover"
              style={{ objectPosition: 'center center' }}
              priority={index === 0}
              sizes="100vw"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ))}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/85" />
      </div>

      {/* Content overlay (passed as children) */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
