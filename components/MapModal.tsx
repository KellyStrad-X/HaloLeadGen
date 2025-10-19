'use client';

import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

interface Location {
  lat: number;
  lng: number;
}

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  location?: Location | null;
  leadCount?: number;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  center: Location;
  zoom: number;
  onMarkerClick: (campaignId: string) => void;
}

// Get marker color based on campaign/job status
function getMarkerColor(campaign: Campaign): string {
  if (campaign.campaignStatus === 'Active') return '#00d4ff'; // Cyan
  if (campaign.jobStatus === 'Completed') return '#22c55e'; // Green
  if (campaign.jobStatus === 'Pending') return '#f97316'; // Orange
  return '#6b7280'; // Gray (Inactive)
}

// Get status text for tooltip
function getStatusText(campaign: Campaign): string {
  const parts = [];
  parts.push(`Campaign: ${campaign.campaignStatus}`);
  if (campaign.jobStatus) {
    parts.push(`Job: ${campaign.jobStatus}`);
  }
  return parts.join(' • ');
}

export default function MapModal({
  isOpen,
  onClose,
  campaigns,
  center,
  zoom,
  onMarkerClick,
}: MapModalProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const [hoveredCampaign, setHoveredCampaign] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMarkerHover = (campaignId: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setHoveredCampaign(campaignId);
  };

  const handleMarkerLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredCampaign(null);
    }, 100);
    setHoverTimeout(timeout);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-[#0d1117] border border-[#373e47] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-[#0d1117]/95 border-b border-[#373e47] p-4 flex items-center justify-between backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-white">Campaign Locations</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-gray-300">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-gray-300">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                <span className="text-gray-300">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-300">Inactive</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-2"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
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
        </div>

        {/* Map */}
        <div className="w-full h-full pt-24">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={center}
              defaultZoom={zoom}
              {...(mapId && { mapId })}
              style={{ width: '100%', height: '100%' }}
            >
              {campaigns.map((campaign) =>
                campaign.location ? (
                  <div key={campaign.id}>
                    <AdvancedMarker
                      position={campaign.location}
                      onClick={() => onMarkerClick(campaign.id)}
                      onMouseEnter={() => handleMarkerHover(campaign.id)}
                      onMouseLeave={handleMarkerLeave}
                    >
                      <div className="relative cursor-pointer">
                        <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
                          <defs>
                            {/* Define a mask with a hole in the center */}
                            <mask id={`marker-mask-modal-${campaign.id}`}>
                              {/* White area is visible */}
                              <rect x="0" y="0" width="40" height="50" fill="white" />
                              {/* Black area is transparent (the hole) */}
                              <circle cx="20" cy="14" r="6" fill="black" />
                            </mask>
                          </defs>
                          {/* Outer pin shape with mask applied */}
                          <path
                            d="M20 0C12.268 0 6 6.268 6 14c0 10.5 14 26 14 26s14-15.5 14-26c0-7.732-6.268-14-14-14z"
                            fill={getMarkerColor(campaign)}
                            stroke="#ffffff"
                            strokeWidth="2"
                            mask={`url(#marker-mask-modal-${campaign.id})`}
                          />
                        </svg>
                      </div>
                    </AdvancedMarker>

                    {hoveredCampaign === campaign.id && (
                      <InfoWindow
                        position={campaign.location}
                        pixelOffset={[0, -40]}
                        onCloseClick={() => setHoveredCampaign(null)}
                      >
                        <div
                          className="p-2 min-w-[200px]"
                          onMouseEnter={() => handleMarkerHover(campaign.id)}
                          onMouseLeave={handleMarkerLeave}
                        >
                          <h3 className="font-bold text-gray-900 mb-2">
                            {campaign.campaignName}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Campaign:</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  campaign.campaignStatus === 'Active'
                                    ? 'bg-cyan-100 text-cyan-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {campaign.campaignStatus}
                              </span>
                            </div>
                            {campaign.jobStatus && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Job Status:</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    campaign.jobStatus === 'Completed'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  {campaign.jobStatus}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Leads:</span>
                              <span className="font-semibold text-gray-900">
                                {campaign.leadCount || 0}
                              </span>
                            </div>
                            {campaign.showcaseAddress && (
                              <div className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-200">
                                {campaign.showcaseAddress}
                              </div>
                            )}
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </div>
                ) : null
              )}
            </Map>
          </APIProvider>
        </div>
      </div>
    </div>
  );
}
