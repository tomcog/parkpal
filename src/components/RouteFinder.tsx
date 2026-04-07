import { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent } from "./ui/drawer";
import { Button } from "./ui/button";
import { ButtonStandard } from "./ButtonStandard";
import {
  X, Route as RouteIcon, Loader2, MapPin, ArrowRight,
  Bookmark, ExternalLink, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import NounNationalPark from "../imports/NounNationalPark19895091";
import { nationalParks, type NationalPark } from "../data/nationalParks";
import {
  fetchRoute, findParksAlongRoute, decodePolyline, encodePolyline,
  type ParkAlongRoute,
} from "../utils/route";
import AddressAutocomplete from "./AddressAutocomplete";
import { supabase, type SavedRouteRow } from "../utils/supabase/client";

interface RouteFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  userId: string | null;
  onSelectPark: (parkId: string) => void;
}

const DEFAULT_CORRIDOR_MILES = 50;
const MIN_CORRIDOR_MILES = 5;
const MAX_CORRIDOR_MILES = 200;
// Google Maps Directions URLs accept at most 9 waypoints between origin and destination.
const MAX_GOOGLE_MAPS_WAYPOINTS = 9;

export default function RouteFinder({
  open, onOpenChange, apiKey, userId, onSelectPark,
}: RouteFinderProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [corridorMiles, setCorridorMiles] = useState(DEFAULT_CORRIDOR_MILES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encodedPolyline, setEncodedPolyline] = useState<string | null>(null);
  const [results, setResults] = useState<ParkAlongRoute<NationalPark>[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ miles: number; hours: number } | null>(null);

  // Saved trips
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteRow[]>([]);
  const [savedListOpen, setSavedListOpen] = useState(true);
  const [namingTrip, setNamingTrip] = useState(false);
  const [tripName, setTripName] = useState("");
  const [savingTrip, setSavingTrip] = useState(false);

  const loadSavedRoutes = useCallback(async () => {
    if (!userId) {
      setSavedRoutes([]);
      return;
    }
    const { data, error: loadErr } = await supabase
      .from("saved_routes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (loadErr) {
      console.error("Failed to load saved routes:", loadErr);
      return;
    }
    setSavedRoutes(data ?? []);
  }, [userId]);

  // Load saved routes when the drawer opens (signed-in users only).
  useEffect(() => {
    if (!open) return;
    loadSavedRoutes();
  }, [open, loadSavedRoutes]);

  // Re-filter park results live as the corridor slider moves on an existing route.
  useEffect(() => {
    if (!encodedPolyline) return;
    setResults(findParksAlongRoute(nationalParks, encodedPolyline, corridorMiles));
  }, [corridorMiles, encodedPolyline]);

  const handleSearch = async () => {
    if (!origin.trim() || !destination.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setEncodedPolyline(null);
    setRouteMeta(null);
    setNamingTrip(false);
    try {
      const route = await fetchRoute(origin.trim(), destination.trim(), apiKey);
      const parks = findParksAlongRoute(nationalParks, route.encodedPolyline, corridorMiles);
      setEncodedPolyline(route.encodedPolyline);
      setResults(parks);
      setRouteMeta({
        miles: route.distanceMeters / 1609.34,
        hours: route.durationSeconds / 3600,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrigin("");
    setDestination("");
    setEncodedPolyline(null);
    setResults([]);
    setRouteMeta(null);
    setError(null);
    setNamingTrip(false);
    setTripName("");
  };

  const handleRecallSaved = (row: SavedRouteRow) => {
    setOrigin(row.origin);
    setDestination(row.destination);
    setEncodedPolyline(row.encoded_polyline);
    setResults(findParksAlongRoute(nationalParks, row.encoded_polyline, corridorMiles));
    setRouteMeta({
      miles: row.distance_meters / 1609.34,
      hours: row.duration_seconds / 3600,
    });
    setError(null);
    setNamingTrip(false);
  };

  const handleSaveTrip = async () => {
    if (!userId || !encodedPolyline || !routeMeta || !tripName.trim()) return;
    setSavingTrip(true);
    const { error: saveErr } = await supabase.from("saved_routes").insert({
      user_id: userId,
      name: tripName.trim(),
      origin,
      destination,
      encoded_polyline: encodedPolyline,
      distance_meters: Math.round(routeMeta.miles * 1609.34),
      duration_seconds: Math.round(routeMeta.hours * 3600),
    });
    setSavingTrip(false);
    if (saveErr) {
      setError(`Failed to save trip: ${saveErr.message}`);
      return;
    }
    setNamingTrip(false);
    setTripName("");
    loadSavedRoutes();
  };

  const handleDeleteSaved = async (id: string) => {
    const { error: delErr } = await supabase.from("saved_routes").delete().eq("id", id);
    if (delErr) {
      setError(`Failed to delete: ${delErr.message}`);
      return;
    }
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  // Google Maps Directions URL with parks as waypoints.
  // https://developers.google.com/maps/documentation/urls/get-started#directions-action
  //
  // Notes on the implementation:
  //  - Park *names* are used (not lat/lng) because national park coordinates
  //    often sit deep inside the park where there's no road for Google Maps
  //    to snap to. Names get geocoded to a drivable visitor center.
  //  - Waypoints must be in *traversal order*, otherwise Google Maps tries to
  //    visit them in the order given and produces an unroutable zigzag.
  //    `results` is already sorted by routeOrderKey from findParksAlongRoute.
  //  - Capped at MAX_GOOGLE_MAPS_WAYPOINTS (Google Maps' free URL limit).
  const googleMapsUrl = (() => {
    if (!encodedPolyline || !origin || !destination) return null;
    const params = new URLSearchParams({
      api: "1",
      origin,
      destination,
      travelmode: "driving",
    });
    if (results.length > 0) {
      const waypointParks = results.slice(0, MAX_GOOGLE_MAPS_WAYPOINTS);
      params.set(
        "waypoints",
        waypointParks.map((r) => r.park.name).join("|"),
      );
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  })();

  // Build a static map URL: route polyline + a marker per nearby park.
  // The full encoded polyline from Routes API is often >16KB. Static Maps'
  // unencoded path syntax is capped at ~100 points, so we sample the points
  // down and re-encode them as a polyline (`enc:`), which is far more compact.
  const staticMapUrl = (() => {
    if (!encodedPolyline) return null;

    const allPoints = decodePolyline(encodedPolyline);
    const TARGET_POINTS = 600;
    const step = Math.max(1, Math.ceil(allPoints.length / TARGET_POINTS));
    const sampled: typeof allPoints = [];
    for (let i = 0; i < allPoints.length; i += step) sampled.push(allPoints[i]);
    if (sampled[sampled.length - 1] !== allPoints[allPoints.length - 1]) {
      sampled.push(allPoints[allPoints.length - 1]);
    }

    const reencoded = encodePolyline(sampled);
    const path = `path=color:0x30bf17ff%7Cweight:4%7Cenc:${encodeURIComponent(reencoded)}`;

    const markerParks = results.slice(0, 20);
    let markersParam = "";
    if (markerParks.length > 0) {
      const locations = markerParks
        .map((r) => `${r.park.lat.toFixed(4)},${r.park.lng.toFixed(4)}`)
        .join("%7C");
      markersParam = `markers=color:0x22c55e%7Csize:small%7C${locations}`;
    }
    const base = `https://maps.googleapis.com/maps/api/staticmap?size=640x320&scale=2&${path}`;
    return markersParam
      ? `${base}&${markersParam}&key=${apiKey}`
      : `${base}&key=${apiKey}`;
  })();

  const isGuest = !userId;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="!h-[100vh] !max-h-[100vh] !mt-0 !rounded-none !border-none !p-0 [&>div:first-child]:hidden">
        <div className="flex flex-col h-full bg-white overflow-y-auto">
          <p className="sr-only">Find parks along your route</p>

          {/* Header */}
          <div className="flex flex-col gap-6 items-center px-6 pt-6 pb-4">
            <div className="flex items-start w-full">
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors opacity-50 hover:opacity-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[64px] w-fit">
              <NounNationalPark />
            </div>

            <div className="flex flex-col gap-1 items-center">
              <div className="flex items-center gap-2 text-brand-accent">
                <RouteIcon className="w-6 h-6" />
                <h2 className="text-2xl font-semibold tracking-tight text-[#313730]">Parks along the way</h2>
              </div>
              <p className="text-sm text-gray-500 text-center max-w-[320px]">
                Enter a start and end location to find national parks near your route.
              </p>
            </div>
          </div>

          {/* Saved trips (signed-in users with at least one saved trip) */}
          {!isGuest && savedRoutes.length > 0 && (
            <div className="px-6 pb-4 max-w-[560px] w-full mx-auto">
              <button
                onClick={() => setSavedListOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left mb-2"
              >
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Saved trips ({savedRoutes.length})
                </h3>
                {savedListOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              {savedListOpen && (
                <ul className="flex flex-col gap-2">
                  {savedRoutes.map((row) => (
                    <li key={row.id} className="flex items-stretch gap-2">
                      <button
                        onClick={() => handleRecallSaved(row)}
                        className="flex-1 text-left p-3 bg-[#f3f3f5] hover:bg-[#e8e8eb] rounded-[4px] transition-colors min-w-0"
                      >
                        <p className="font-semibold text-[15px] text-[#0a0a0a] truncate">{row.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {row.origin} → {row.destination}
                        </p>
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(row.id)}
                        className="px-3 bg-[#f3f3f5] hover:bg-red-50 hover:text-red-600 rounded-[4px] transition-colors text-gray-400"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Inputs */}
          <div className="flex flex-col gap-3 px-6 pb-4 max-w-[560px] w-full mx-auto">
            <AddressAutocomplete
              apiKey={apiKey}
              value={origin}
              onChange={setOrigin}
              placeholder="Starting location"
              icon={<MapPin className="w-5 h-5" />}
              onEnter={handleSearch}
            />
            <AddressAutocomplete
              apiKey={apiKey}
              value={destination}
              onChange={setDestination}
              placeholder="Destination"
              icon={<ArrowRight className="w-5 h-5" />}
              onEnter={handleSearch}
            />
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-baseline justify-between">
                <label htmlFor="corridor-slider" className="text-sm text-gray-500">
                  Search within
                </label>
                <span className="text-sm font-semibold text-brand-accent">
                  {corridorMiles} {corridorMiles === 1 ? "mile" : "miles"}
                </span>
              </div>
              <input
                id="corridor-slider"
                type="range"
                min={MIN_CORRIDOR_MILES}
                max={MAX_CORRIDOR_MILES}
                step={5}
                value={corridorMiles}
                onChange={(e) => setCorridorMiles(parseInt(e.target.value, 10))}
                className="w-full accent-brand-accent"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={loading || !origin.trim() || !destination.trim()}
                className="flex-1 h-11 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-[4px] text-base font-semibold gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RouteIcon className="w-5 h-5" />}
                {loading ? "Finding parks..." : "Find parks"}
              </Button>
              {(encodedPolyline || error) && (
                <ButtonStandard onClick={handleReset} theme="white" className="px-4">
                  Reset
                </ButtonStandard>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[4px] px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Map preview */}
          {staticMapUrl && (
            <div className="px-6 pb-4 max-w-[560px] w-full mx-auto">
              <img
                src={staticMapUrl}
                alt="Route map"
                className="w-full rounded-[4px] border border-gray-200"
              />
              {routeMeta && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {Math.round(routeMeta.miles).toLocaleString()} miles · {routeMeta.hours.toFixed(1)} hours driving
                </p>
              )}
            </div>
          )}

          {/* Action row: Save + Open in Google Maps */}
          {encodedPolyline && (
            <div className="px-6 pb-4 max-w-[560px] w-full mx-auto flex flex-col gap-2">
              {namingTrip ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTrip();
                      if (e.key === "Escape") { setNamingTrip(false); setTripName(""); }
                    }}
                    placeholder="Name this trip"
                    className="flex-1 h-[44px] px-3 bg-[#f3f3f5] border border-transparent rounded-[4px] text-[16px] text-[#0a0a0a] placeholder:text-[#99A1AF] focus:outline-none focus:border-brand-accent focus:bg-white transition-colors"
                  />
                  <Button
                    onClick={handleSaveTrip}
                    disabled={!tripName.trim() || savingTrip}
                    className="h-11 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-[4px] px-4"
                  >
                    {savingTrip ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                  <ButtonStandard
                    onClick={() => { setNamingTrip(false); setTripName(""); }}
                    theme="white"
                    className="px-3"
                  >
                    Cancel
                  </ButtonStandard>
                </div>
              ) : (
                <div className="flex gap-2">
                  {!isGuest && (
                    <ButtonStandard
                      onClick={() => setNamingTrip(true)}
                      theme="white"
                      icon={<Bookmark className="w-4 h-4" />}
                      className="flex-1"
                    >
                      Save trip
                    </ButtonStandard>
                  )}
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <ButtonStandard
                        type="button"
                        theme="white"
                        icon={<ExternalLink className="w-4 h-4" />}
                        className="w-full"
                      >
                        Open in Google Maps
                      </ButtonStandard>
                    </a>
                  )}
                </div>
              )}
              {isGuest && (
                <p className="text-xs text-gray-400 text-center">
                  Sign in to save trips
                </p>
              )}
            </div>
          )}

          {/* Park results */}
          {encodedPolyline && (
            <div className="px-6 pb-8 max-w-[560px] w-full mx-auto flex-1">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#313730]">
                  {results.length === 0
                    ? "No parks within range"
                    : `${results.length} ${results.length === 1 ? "park" : "parks"} along your route`}
                </h3>
              </div>
              <ul className="flex flex-col gap-2">
                {results.map(({ park, distanceMiles }) => (
                  <li key={park.id}>
                    <button
                      onClick={() => {
                        onSelectPark(park.id);
                        onOpenChange(false);
                      }}
                      className="w-full text-left flex items-center gap-3 p-3 bg-[#f3f3f5] hover:bg-[#e8e8eb] rounded-[4px] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-[#0a0a0a] truncate">{park.name}</p>
                        <p className="text-sm text-gray-500">{park.state}</p>
                      </div>
                      <span className="text-brand-accent font-semibold text-sm flex-shrink-0">
                        {Math.round(distanceMiles)} mi
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
