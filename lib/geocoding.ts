/**
 * Geocoding utilities for Google Maps integration
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
 * Geocode an address using Google Geocoding API
 * Returns null if geocoding fails or address is invalid
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  if (!address || !address.trim()) {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key not configured');
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

/**
 * Batch geocode multiple addresses with rate limiting
 * Processes addresses sequentially with delay to avoid hitting API limits
 */
export async function batchGeocodeAddresses(
  addresses: { id: string; address: string }[]
): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>();

  for (const { id, address } of addresses) {
    const result = await geocodeAddress(address);

    if (result) {
      results.set(id, result);
    }

    // Rate limit: 50 requests per second max, we'll do 10/sec to be safe
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
