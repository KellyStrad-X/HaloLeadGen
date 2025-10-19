'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { StormInfo } from '@/lib/firestore';

interface StormInfoModalProps {
  stormInfo: StormInfo;
  onClose: () => void;
  onViewDamage?: () => void;
  onRequestInspection?: () => void;
}

export default function StormInfoModal({ stormInfo, onClose, onViewDamage, onRequestInspection }: StormInfoModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);
  }, []);
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formattedDate = formatDate(stormInfo.stormDate);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'bg-opacity-70' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden transition-all duration-300 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Storm Information</h2>
                  <p className="text-orange-100 text-sm">Documented weather event details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-100 transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Storm Date */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Storm Date
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {formattedDate || 'Date not available'}
              </p>
            </div>

            {/* Storm Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Wind Speed */}
              {stormInfo.windSpeed && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2.5C9 1.67 9.67 1 10.5 1h3c.83 0 1.5.67 1.5 1.5S14.33 4 13.5 4h-3C9.67 4 9 3.33 9 2.5zm0 0v0M5 8.5C5 7.67 5.67 7 6.5 7h11c.83 0 1.5.67 1.5 1.5S18.33 10 17.5 10h-11C5.67 10 5 9.33 5 8.5zm0 0v0M3 15c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-15C3.67 16.5 3 15.83 3 15z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-blue-700 uppercase">Wind Speed</h4>
                      <p className="text-xl font-bold text-blue-900">{stormInfo.windSpeed}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hail Size */}
              {stormInfo.hailSize && (
                <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8" opacity="0.3"/>
                        <circle cx="12" cy="12" r="5"/>
                        <circle cx="9" cy="10" r="1.5" fill="white" opacity="0.6"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-cyan-700 uppercase">Hail Size</h4>
                      <p className="text-xl font-bold text-cyan-900">{stormInfo.hailSize}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Affected Areas */}
            {stormInfo.affectedAreas && (
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-red-700 uppercase mb-2">
                  Affected Areas
                </h4>
                <p className="text-gray-800 leading-relaxed">
                  {stormInfo.affectedAreas}
                </p>
              </div>
            )}

            {/* Additional Notes */}
            {stormInfo.additionalNotes && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="text-sm font-semibold text-amber-700 uppercase mb-2">
                  Additional Information
                </h4>
                <p className="text-gray-800 leading-relaxed">
                  {stormInfo.additionalNotes}
                </p>
              </div>
            )}

            {/* Warning Banner */}
            <div className="bg-gradient-to-r from-orange-100 to-red-100 border-l-4 border-orange-500 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h5 className="font-bold text-orange-900 mb-1">Time-Sensitive Damage</h5>
                  <p className="text-sm text-orange-800">
                    Storm damage can worsen quickly. Most insurance claims must be filed within 1-2 years of the storm date. Get a free inspection today to document any damage before it's too late.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onClose();
                  onViewDamage?.();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg"
              >
                Close & View Damage!
              </button>
              <button
                onClick={() => {
                  onClose();
                  onRequestInspection?.();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                Close & Request Inspection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
