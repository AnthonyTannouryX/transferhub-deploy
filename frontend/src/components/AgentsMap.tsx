'use client';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { redPin } from '@/lib/leaflet-icons';

type Store = {
  id: string;
  store_name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  status: 'active' | 'inactive' | 'pending';
};

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function AgentsMap() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/agent-stores')
      .then(r => r.json())
      .then(json => setStores(json.data ?? []))
      .catch(() => setStores([]));
  }, []);

  const points = useMemo<[number, number][]>(() =>
    stores.map(s => [s.latitude, s.longitude]), [stores]);

  const initialCenter: [number, number] = points[0] ?? [40.7128, -74.0060];

  return (
    <div style={{ height: 420, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <FitToMarkers points={points} />

        {stores.map(s => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={redPin}>

            <Popup>
              <div style={{ lineHeight: 1.3 }}>
                <strong>{s.store_name}</strong><br />
                {s.address ? `${s.address}, ` : ''}{s.city}{s.country ? `, ${s.country}` : ''}<br />
                {s.phone && <>📞 {s.phone}<br /></>}
                Status: <b>{s.status}</b>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
