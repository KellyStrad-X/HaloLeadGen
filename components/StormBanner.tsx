'use client';

import { useState } from 'react';
import type { StormInfo } from '@/lib/firestore';
import StormInfoModal from './StormInfoModal';

interface StormBannerProps {
  stormInfo: StormInfo;
}

export default function StormBanner({ stormInfo }: StormBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewDamage = () => {
    scrollToSection('photo-gallery');
  };

  const handleRequestInspection = () => {
    scrollToSection('lead-form');
  };

  const getFormattedDate = () => {
    if (!stormInfo.stormDate) return null;
    const date = new Date(stormInfo.stormDate);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formattedDate = getFormattedDate();

  return (
    <>
      {/* Storm Alert Banner */}
      <section className="py-4 px-4 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Icon + Message */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {formattedDate
                    ? `Storm Alert: ${formattedDate}`
                    : 'Recent Storm Activity'}
                </h3>
                <p className="text-orange-100 text-sm">
                  Your area was affected by severe weather. Free damage inspections available.
                </p>
              </div>
            </div>

            {/* Right: View Details Button - centered on mobile */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl flex-shrink-0 w-full sm:w-auto"
            >
              View Storm Details →
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <StormInfoModal
          stormInfo={stormInfo}
          onClose={() => setIsModalOpen(false)}
          onViewDamage={handleViewDamage}
          onRequestInspection={handleRequestInspection}
        />
      )}
    </>
  );
}
