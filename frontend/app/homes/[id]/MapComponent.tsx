'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fixLeafletIcon } from '@/lib/leaflet-fix';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  location: string;
}

// Cache for geocoded locations to avoid repeated API calls
const geocodeCache = new Map<string, [number, number]>();

export default function MapComponent({ location }: MapComponentProps) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>(location);

  useEffect(() => {
    fixLeafletIcon(); // Fix marker icons

    const geocodeLocation = async () => {
      if (!location) {
        setCoordinates([20.5937, 78.9629]); // Default: India
        setLoading(false);
        return;
      }

      // Check cache first
      if (geocodeCache.has(location)) {
        setCoordinates(geocodeCache.get(location)!);
        setLoading(false);
        return;
      }

      try {
        // Using Nominatim (OpenStreetMap's free geocoding service)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
          {
            headers: {
              'User-Agent': 'AirbnbClone/1.0' // Required by Nominatim
            }
          }
        );

        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const coords: [number, number] = [lat, lon];
          
          // Cache the result
          geocodeCache.set(location, coords);
          
          setCoordinates(coords);
          setDisplayName(data[0].display_name || location);
          console.log(`✅ Geocoded "${location}" to:`, coords);
        } else {
          console.warn(`⚠️ Location "${location}" not found, using India fallback`);
          setCoordinates([20.5937, 78.9629]); // Fallback to India
        }
      } catch (err) {
        console.error('❌ Geocoding error:', err);
        setCoordinates([20.5937, 78.9629]); // Fallback to India
      } finally {
        setLoading(false);
      }
    };

    geocodeLocation();
  }, [location]);

  if (loading || !coordinates) {
    return (
      <div style={{ 
        height: '100%', 
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-danger mb-2" role="status">
            <span className="visually-hidden">Loading map...</span>
          </div>
          <p className="text-muted small mb-0">Loading {location}...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer 
      center={coordinates} 
      zoom={12} 
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={coordinates}>
        <Popup>
          <div style={{ minWidth: '150px' }}>
            <strong style={{ fontSize: '14px' }}>{location}</strong>
            <div style={{ fontSize: '11px', color: '#717171', marginTop: '4px' }}>
              {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}