'use client';

import { useEffect, useState, useCallback } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useAuth } from '@/lib/auth-context';
import { geocodeAddress, type Location } from '@/lib/geocoding';

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
}

interface CampaignWithLocation extends Campaign {
  location: Location;
}

export default function CampaignMap() {
  const { user } = useAuth();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const [campaigns, setCampaigns] = useState<CampaignWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: 29.7604, lng: -95.3698 });
  const [mapZoom, setMapZoom] = useState(10);

  const fetchAndGeocodeCampaigns = useCallback(async () => {
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

      // Filter campaigns that have addresses
      const campaignsWithAddresses = allCampaigns.filter(
        (c) => c.showcaseAddress && c.showcaseAddress.trim()
      );

      if (campaignsWithAddresses.length === 0) {
        setLoading(false);
        return;
      }

      // Geocode addresses
      const geocodedCampaigns: CampaignWithLocation[] = [];

      for (const campaign of campaignsWithAddresses) {
        const result = await geocodeAddress(campaign.showcaseAddress!);

        if (result) {
          geocodedCampaigns.push({
            ...campaign,
            location: result.location,
          });
        }

        // Rate limit: small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setCampaigns(geocodedCampaigns);

      // Calculate center and zoom to fit all markers
      if (geocodedCampaigns.length > 0) {
        const bounds = geocodedCampaigns.reduce(
          (acc, c) => ({
            minLat: Math.min(acc.minLat, c.location.lat),
            maxLat: Math.max(acc.maxLat, c.location.lat),
            minLng: Math.min(acc.minLng, c.location.lng),
            maxLng: Math.max(acc.maxLng, c.location.lng),
          }),
          {
            minLat: geocodedCampaigns[0].location.lat,
            maxLat: geocodedCampaigns[0].location.lat,
            minLng: geocodedCampaigns[0].location.lng,
            maxLng: geocodedCampaigns[0].location.lng,
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
      console.error('Error fetching/geocoding campaigns:', error);
      setLoading(false);
    }
  }, [user, apiKey]);

  useEffect(() => {
    fetchAndGeocodeCampaigns();
  }, [fetchAndGeocodeCampaigns]);

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
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
          {...(mapId && { mapId })}
          style={{ width: '100%', height: '100%' }}
        >
          {campaigns.map((campaign) => (
            <Marker
              key={campaign.id}
              position={campaign.location}
              title={campaign.campaignName}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
