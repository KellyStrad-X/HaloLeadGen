'use client';

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

export default function CampaignMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  // Houston, TX center point
  const center = { lat: 29.7604, lng: -95.3698 };

  if (!apiKey) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-900/40 rounded-lg">
        <p className="text-gray-400">Map unavailable: API key not configured</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={10}
          {...(mapId && { mapId })}
          style={{ width: '100%', height: '100%' }}
        >
          <Marker position={center} />
        </Map>
      </APIProvider>
    </div>
  );
}
