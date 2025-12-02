import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "@/lib/leaflet-icons";
import { redPin } from "@/lib/leaflet-icons";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function LocationMarker({ position, onPositionChange }: {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} icon={redPin} />;
}

export default function LocationPicker({
  initialLat = 33.8886,
  initialLng = 35.4955,
  onLocationChange
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const mapRef = useRef<L.Map | null>(null);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span>Click on the map to set your store location</span>
      </div>

      <div
        className="rounded-lg overflow-hidden border-2 border-gray-200"
        style={{ height: 400, width: "100%" }}
      >
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <LocationMarker
            position={position}
            onPositionChange={handlePositionChange}
          />
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-gray-500 block mb-1">Latitude</span>
          <span className="font-mono font-semibold text-gray-900">{position[0].toFixed(6)}</span>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-gray-500 block mb-1">Longitude</span>
          <span className="font-mono font-semibold text-gray-900">{position[1].toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}
