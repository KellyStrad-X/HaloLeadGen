'use client';

import { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

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
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-slate-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-slate-900/95 border-b border-slate-700 p-4 flex items-center justify-between">
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
            className="text-gray-400 hover:text-white transition-colors p-2"
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
                  <AdvancedMarker
                    key={campaign.id}
                    position={campaign.location}
                    title={`${campaign.campaignName}\n${getStatusText(campaign)}\n${campaign.showcaseAddress || ''}`}
                    onClick={() => onMarkerClick(campaign.id)}
                  >
                    <Pin
                      background={getMarkerColor(campaign)}
                      borderColor="#1e293b"
                      glyphColor="#1e293b"
                    />
                  </AdvancedMarker>
                ) : null
              )}
            </Map>
          </APIProvider>
        </div>
      </div>
    </div>
  );
}
