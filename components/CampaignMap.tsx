'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useAuth } from '@/lib/auth-context';
import MapModal from './MapModal';

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

// Get marker color based on campaign/job status
function getMarkerColor(campaign: Campaign): string {
  // Priority: Active campaigns (Cyan), Completed jobs (Green), Pending jobs (Orange), Inactive (Gray)
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

export default function CampaignMap() {
  const { user } = useAuth();
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: 29.7604, lng: -95.3698 });
  const [mapZoom, setMapZoom] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMarkerClick = (campaignId: string) => {
    router.push(`/dashboard/campaigns/${campaignId}`);
  };

  const fetchCampaigns = useCallback(async () => {
    if (!user || !apiKey) {
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/dashboard/campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch campaigns');
        setLoading(false);
        return;
      }

      const data = await response.json();
      const allCampaigns: Campaign[] = data.campaigns;

      // Filter campaigns that have geocoded locations
      const campaignsWithLocations = allCampaigns.filter(
        (c) => c.location && c.location.lat && c.location.lng
      );

      if (campaignsWithLocations.length === 0) {
        setLoading(false);
        return;
      }

      setCampaigns(campaignsWithLocations);

      // Calculate center and zoom to fit all markers
      if (campaignsWithLocations.length > 0) {
        const bounds = campaignsWithLocations.reduce(
          (acc, c) => ({
            minLat: Math.min(acc.minLat, c.location!.lat),
            maxLat: Math.max(acc.maxLat, c.location!.lat),
            minLng: Math.min(acc.minLng, c.location!.lng),
            maxLng: Math.max(acc.maxLng, c.location!.lng),
          }),
          {
            minLat: campaignsWithLocations[0].location!.lat,
            maxLat: campaignsWithLocations[0].location!.lat,
            minLng: campaignsWithLocations[0].location!.lng,
            maxLng: campaignsWithLocations[0].location!.lng,
          }
        );

        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        const centerLng = (bounds.minLng + bounds.maxLng) / 2;

        setMapCenter({ lat: centerLat, lng: centerLng });

        // Simple zoom calculation based on bounds
        const latDiff = bounds.maxLat - bounds.minLat;
        const lngDiff = bounds.maxLng - bounds.minLng;
        const maxDiff = Math.max(latDiff, lngDiff);

        if (maxDiff < 0.01) setMapZoom(14);
        else if (maxDiff < 0.05) setMapZoom(12);
        else if (maxDiff < 0.1) setMapZoom(11);
        else if (maxDiff < 0.5) setMapZoom(10);
        else if (maxDiff < 1) setMapZoom(9);
        else setMapZoom(8);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setLoading(false);
    }
  }, [user, apiKey]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (!apiKey) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-900/40 rounded-lg">
        <p className="text-gray-400">Map unavailable: API key not configured</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-900/40 rounded-lg">
        <p className="text-gray-400">Loading campaign locations...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-900/40 rounded-lg">
        <p className="text-gray-400">No campaigns with addresses to display</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Legend and Expand Button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-4 text-sm">
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            Expand
          </button>
        </div>

        {/* Map */}
        <div className="h-[400px] w-full rounded-lg overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              {...(mapId && { mapId })}
              style={{ width: '100%', height: '100%' }}
            >
              {campaigns.map((campaign) =>
                campaign.location ? (
                  <AdvancedMarker
                    key={campaign.id}
                    position={campaign.location}
                    title={`${campaign.campaignName}\n${getStatusText(campaign)}\n${campaign.showcaseAddress || ''}`}
                    onClick={() => handleMarkerClick(campaign.id)}
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

      {/* Full-Screen Modal */}
      <MapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaigns={campaigns}
        center={mapCenter}
        zoom={mapZoom}
        onMarkerClick={handleMarkerClick}
      />
    </>
  );
}
