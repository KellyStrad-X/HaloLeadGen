'use client';

import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface Location {
  lat: number;
  lng: number;
}

interface CompletedMapLocation {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  location: Location;
  completedAt: string | null;
}

interface HaloMapProps {
  campaignId: string;
  campaignLocation?: Location;
  contractorName: string;
}

const MAX_RADIUS_MILES = 10;
const MIN_NEARBY_MARKERS = 5;
const DEFAULT_CENTER: Location = { lat: 29.7604, lng: -95.3698 }; // Houston as neutral fallback
const DEFAULT_ZOOM = 10;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function distanceInMiles(a: Location, b: Location): number {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMiles * c;
}

export default function HaloMap({ campaignId, campaignLocation, contractorName }: HaloMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const [locations, setLocations] = useState<CompletedMapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<Location>(
    campaignLocation || DEFAULT_CENTER
  );
  const [mapZoom, setMapZoom] = useState<number>(campaignLocation ? 12 : DEFAULT_ZOOM);

  useEffect(() => {
    async function fetchCompletedLocations() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/map-leads`);
        if (response.ok) {
          const data = await response.json();
          const completedLocations: CompletedMapLocation[] = data.locations || [];
          setLocations(completedLocations);

          if (completedLocations.length > 0) {
            let focusLocations: CompletedMapLocation[] = completedLocations;

            if (campaignLocation) {
              const sortedByDistance = [...completedLocations]
                .map((item) => ({
                  item,
                  distance: distanceInMiles(item.location, campaignLocation),
                }))
                .sort((a, b) => a.distance - b.distance);

              const withinRadius = sortedByDistance
                .filter(({ distance }) => distance <= MAX_RADIUS_MILES)
                .map(({ item }) => item);

              if (withinRadius.length >= MIN_NEARBY_MARKERS) {
                focusLocations = withinRadius;
              } else {
                focusLocations = sortedByDistance
                  .slice(0, Math.max(MIN_NEARBY_MARKERS, Math.min(3, sortedByDistance.length)))
                  .map(({ item }) => item);
              }

              // Ensure the current campaign location (even if not completed yet) influences framing
              if (focusLocations.length > 0) {
                focusLocations = [...focusLocations, { id: 'current', campaignName: 'Current Campaign', showcaseAddress: null, location: campaignLocation, completedAt: null }];
              }
            }

            const boundsSource = focusLocations.length > 0 ? focusLocations : completedLocations;

            const bounds = boundsSource.reduce(
              (acc, item) => ({
                minLat: Math.min(acc.minLat, item.location.lat),
                maxLat: Math.max(acc.maxLat, item.location.lat),
                minLng: Math.min(acc.minLng, item.location.lng),
                maxLng: Math.max(acc.maxLng, item.location.lng),
              }),
              {
                minLat: boundsSource[0].location.lat,
                maxLat: boundsSource[0].location.lat,
                minLng: boundsSource[0].location.lng,
                maxLng: boundsSource[0].location.lng,
              }
            );

            const centerLat = (bounds.minLat + bounds.maxLat) / 2;
            const centerLng = (bounds.minLng + bounds.maxLng) / 2;
            setMapCenter({ lat: centerLat, lng: centerLng });

            const latDiff = bounds.maxLat - bounds.minLat;
            const lngDiff = bounds.maxLng - bounds.minLng;
            const maxDiff = Math.max(latDiff, lngDiff);

            if (maxDiff < 0.01) setMapZoom(14);
            else if (maxDiff < 0.05) setMapZoom(12);
            else if (maxDiff < 0.1) setMapZoom(11);
            else if (maxDiff < 0.5) setMapZoom(10);
            else if (maxDiff < 1) setMapZoom(9);
            else setMapZoom(8);
          } else if (campaignLocation) {
            setMapCenter(campaignLocation);
            setMapZoom(12);
          } else {
            setMapCenter(DEFAULT_CENTER);
            setMapZoom(DEFAULT_ZOOM);
          }
        }
      } catch (error) {
        console.error('Error fetching completed campaign locations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompletedLocations();
  }, [campaignId, campaignLocation]);

  if (!apiKey) {
    return null; // Silently hide if no API key
  }

  if (loading) {
    return (
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="h-[400px] flex items-center justify-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400">Loading map...</p>
          </div>
        </div>
      </section>
    );
  }

  // Empty state - show encouraging message
  if (locations.length === 0) {
    return (
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Active in Your Neighborhood
            </h2>
            <p className="text-gray-600 mb-6">
              Be the first in your area to schedule with {contractorName}!
            </p>
            <ul className="space-y-3 max-w-md mx-auto text-left">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">Free roof inspection</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">No obligation quote</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">Local, trusted contractor</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">Insurance claim assistance</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Active in Your Neighborhood
          </h2>
          <p className="text-gray-600">
            {contractorName} is working in your area right now
          </p>
        </div>

        {/* Map */}
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <APIProvider apiKey={apiKey}>
            <Map
              center={mapCenter}
              zoom={mapZoom}
              {...(mapId && { mapId })}
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={false}
              zoomControl={true}
              mapTypeControl={false}
              streetViewControl={false}
            >
              {locations.map((item) => (
                <AdvancedMarker
                  key={item.id}
                  position={{
                    lat: item.location.lat,
                    lng: item.location.lng,
                  }}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full border-2 border-white shadow-lg bg-green-500" />
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-gray-500 text-center mt-3">
          Approximate locations shown for privacy. Markers represent general areas where {contractorName} has completed projects, not exact addresses.
        </p>
      </div>
    </section>
  );
}
