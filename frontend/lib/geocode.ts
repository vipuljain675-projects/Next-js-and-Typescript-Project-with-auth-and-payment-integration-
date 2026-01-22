// lib/geocode.ts
// Utility for converting location strings to coordinates

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Geocodes a location string to coordinates using OpenStreetMap Nominatim
 * @param location - Location string (e.g., "Mumbai, India")
 * @returns Promise with [latitude, longitude] or null if not found
 */
export async function geocodeLocation(location: string): Promise<[number, number] | null> {
  if (!location) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      {
        headers: {
          'User-Agent': 'AirbnbClone/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data: GeocodeResult[] = await response.json() as GeocodeResult[];

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return [lat, lon];
      }
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Common fallback coordinates by country
 */
export const FALLBACK_COORDINATES: Record<string, [number, number]> = {
  India: [20.5937, 78.9629],
  USA: [37.0902, -95.7129],
  UK: [55.3781, -3.4360],
  Japan: [36.2048, 138.2529],
  Australia: [-25.2744, 133.7751],
  Default: [20.5937, 78.9629], // India as default
};

/**
 * Gets coordinates for a location with fallback
 */
export async function getCoordinatesWithFallback(
  location: string,
  fallbackCountry: string = 'Default'
): Promise<[number, number]> {
  const coords = await geocodeLocation(location);
  
  if (coords) {
    return coords;
  }
  
  // Try to extract country from location string
  const parts = location.split(',').map(s => s.trim());
  const country = parts[parts.length - 1];
  
  return FALLBACK_COORDINATES[country as keyof typeof FALLBACK_COORDINATES] || 
         FALLBACK_COORDINATES[fallbackCountry as keyof typeof FALLBACK_COORDINATES] || 
         FALLBACK_COORDINATES.Default;
}
