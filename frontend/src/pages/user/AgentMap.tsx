import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { redPin } from "@/lib/leaflet-icons";

import {
  MapPin,
  Phone,
  Clock,
  Search,
  Navigation as NavIcon,
  Shield,
  Globe,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

// ✅ Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "@/lib/leaflet-icons"; // fixes marker icons for Vite
// import "leaflet/dist/leaflet.css"; // if not already global

// --------------------------------------
// Types
// --------------------------------------
type Store = {
  id: string;
  store_name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  status: "active" | "inactive" | "pending";
  opening_hours?: any;
  distance_km?: number;
};

type Suggestion = { id: string; store_name: string };

// --------------------------------------
// Small helpers (fetch + map center tracker)
// --------------------------------------
async function getStores(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const res = await fetch(`http://localhost:8000/api/public/stores?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load stores");
  const json = await res.json();
  return (json?.data ?? []) as Store[];
}

async function getSuggestions(q: string): Promise<Suggestion[]> {
  const res = await fetch(
    `http://localhost:8000/api/public/store-suggestions?q=${encodeURIComponent(q)}`
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.data ?? []) as Suggestion[];
}

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
      if (!points.length) return;
      const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [40, 40] });
      // No cleanup needed
    }, [points, map]);
  return null;
}

function TrackCenter({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      onChange(c.lat, c.lng);
    };
    map.on("moveend", handler);
    handler(); // initial
    return () => {
      map.off("moveend", handler);
    };
  }, [map, onChange]);
  return null;
}

// --------------------------------------
// Page
// --------------------------------------
export default function AgentMap() {
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // ✅ Real stores from backend for the MAP
  const [stores, setStores] = useState<Store[]>([]);
  const points = useMemo<[number, number][]>(
    () => stores
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .map((s) => [s.latitude!, s.longitude!]),
    [stores]
  );
  const initialCenter: [number, number] = points[0] ?? [33.8886, 35.4955]; // Lebanon fallback (Beirut)

  // map center + radius for backend "near me"
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [radiusKm] = useState(100); // 100km radius to cover most of Lebanon

  // Memoized callback for map center changes
  const handleMapCenterChange = useCallback((lat: number, lng: number) => {
    setMapCenter([lat, lng]);
  }, []);

  // suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // unified fetch based on current UI state
  const fetchAndSetStores = async () => {
    const [lat, lng] = mapCenter;

    const params: Record<string, string | number | boolean | undefined> = {
      q: searchLocation || undefined,
      lat,
      lng,
      radius_km: radiusKm,
      sort: "distance",
    };

    // Only add open_now filter if "open" is selected
    if (selectedFilter === "open") {
      params.open_now = true;
    }

    try {
      const data = await getStores(params);
      setStores(data);
    } catch {
      setStores([]);
    }
  };

  // initial load
  useEffect(() => {
    fetchAndSetStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when the tab changes
  useEffect(() => {
    fetchAndSetStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  // fetch suggestions as user types (debounced)
  useEffect(() => {
    if (searchLocation.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const items = await getSuggestions(searchLocation);
        setSuggestions(items);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [searchLocation]);

  // Helper function to get today's opening hours
  const getTodayHours = (openingHours: any) => {
    if (!openingHours) return "Hours not available";

    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()];
    const todayHours = openingHours[today];

    if (!todayHours) return "Hours not available";

    // Handle different opening hours formats
    if (todayHours.isOpen === false) return "Closed";
    if (todayHours.startTime && todayHours.endTime) {
      return `${todayHours.startTime} - ${todayHours.endTime}`;
    }
    if (todayHours.hours && todayHours.hours.length > 0) {
      const firstSlot = todayHours.hours[0];
      return `${firstSlot.open} - ${firstSlot.close}`;
    }

    return "Open";
  };

  const filters = [
    { value: "all", label: "All Stores", icon: Globe },
    { value: "open", label: "Open Now", icon: Clock },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-success/10 text-success";
      case "busy":
        return "bg-warning/10 text-warning";
      case "closed":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "busy":
        return "Busy";
      case "closed":
        return "Closed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="user" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Agent Stores</h1>
          <p className="text-muted-foreground">Locate nearby agent stores for cash operations</p>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card border-none mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                {/* Input with suggestions */}
                <div className="relative w-full">
                  <Input
                    placeholder="Enter your location or address"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="text-lg"
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 bg-white border border-gray-200 rounded-md mt-1 w-full shadow-md">
                      {suggestions.map((s) => (
                        <div
                          key={s.id}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => {
                            setSearchLocation(s.store_name);
                            setShowSuggestions(false);
                          }}
                        >
                          {s.store_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button className="gradient-hero text-white border-0" onClick={fetchAndSetStores}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.value}
                    variant={selectedFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ✅ Real Interactive Map */}
        <Card className="shadow-card border-none mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Interactive Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-lg overflow-hidden"
              style={{ height: 384, width: "100%", border: "1px solid hsl(var(--border))" }}
            >
              <MapContainer center={initialCenter} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <FitToMarkers points={points} />
                <TrackCenter onChange={handleMapCenterChange} />
                {stores
                  .filter((s) => s.latitude !== null && s.longitude !== null)
                  .map((s) => (
                    <Marker key={s.id} position={[s.latitude!, s.longitude!]} icon={redPin}>
                      <Popup>
                        <div style={{ lineHeight: 1.3 }}>
                          <strong>{s.store_name}</strong>
                          <br />
                          {s.address ? `${s.address}, ` : ""}
                          {s.city}
                          {s.country ? `, ${s.country}` : ""}
                          <br />
                          {s.phone && (
                            <>
                              📞 {s.phone}
                              <br />
                            </>
                          )}
                          Status: <b>{s.status}</b>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent Store List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No stores found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            stores.map((store) => (
              <Card key={store.id} className="shadow-card hover:shadow-elegant transition-smooth border-none">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏪</div>
                      <div>
                        <CardTitle className="text-lg">{store.store_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={getStatusColor(store.status)}>
                            {getStatusText(store.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(store.address || store.city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          {store.address && <p className="text-sm font-medium">{store.address}</p>}
                          {store.city && (
                            <p className="text-sm text-muted-foreground">
                              {store.city}{store.country ? `, ${store.country}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{store.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{getTodayHours(store.opening_hours)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    {store.phone && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={`tel:${store.phone}`}>
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                    {store.latitude && store.longitude && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <NavIcon className="w-4 h-4 mr-1" />
                          Directions
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      
      </main>
    </div>
  );
}
