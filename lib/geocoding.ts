/**
 * Geocoding utilities for Google Maps integration
 * SERVER-SIDE ONLY - Do not import in client components
 */

export interface Location {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  location: Location;
  formattedAddress: string;
}

/**
 * SERVER-SIDE geocoding using Google Geocoding API
 * Uses server-only API key (NOT exposed to client bundle)
 * Returns null if geocoding fails or address is invalid
 */
export async function geocodeAddressServer(
  address: string
): Promise<GeocodeResult | null> {
  if (!address || !address.trim()) {
    return null;
  }

  // Use server-only API key (NOT NEXT_PUBLIC_ - this keeps it out of client bundle)
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Server-side Google Maps API key not configured (GOOGLE_MAPS_API_KEY)');
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error('Geocoding API request failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('Geocoding failed for address:', address, '- Status:', data.status);
      return null;
    }

    const result = data.results[0];

    return {
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}
