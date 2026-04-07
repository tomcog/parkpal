// Utilities for finding national parks along a driving route.
//
// Strategy: call the Google Routes API to get an encoded polyline for the
// driving route between origin/destination, then locally compute the minimum
// distance from each park to any segment of that polyline. Parks within
// `maxMiles` of the route are returned, sorted nearest-first.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  encodedPolyline: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface ParkAlongRoute<P> {
  park: P;
  distanceMiles: number;
  // Position along the route, used for ordering parks in traversal order.
  // Format: segmentIndex + t (0..1 within that segment), so larger = further along.
  routeOrderKey: number;
}

// ── Polyline encoding/decoding ─────────────────────────────────────────────
// Standard Google encoded polyline algorithm.
// https://developers.google.com/maps/documentation/utilities/polylinealgorithm

function encodeSignedValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let result = "";
  while (v >= 0x20) {
    result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  result += String.fromCharCode(v + 63);
  return result;
}

export function encodePolyline(points: LatLng[]): string {
  let result = "";
  let prevLat = 0;
  let prevLng = 0;
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    result += encodeSignedValue(lat - prevLat);
    result += encodeSignedValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// ── Geometry ────────────────────────────────────────────────────────────────
// Equirectangular projection: for short distances (polyline segments are
// typically <1km apart), projecting lat/lng to a flat plane scaled by the
// cosine of latitude is more than accurate enough for a 50-mile filter.
const MILES_PER_DEGREE = 69.0; // average miles per degree latitude

interface PointToSegmentResult {
  distanceMiles: number;
  t: number; // parameter along segment, clamped to [0, 1]
}

function pointToSegment(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): PointToSegmentResult {
  // Use the midpoint latitude to scale longitudes onto a local plane.
  const midLat = (aLat + bLat) / 2;
  const cosLat = Math.cos((midLat * Math.PI) / 180);

  const ax = aLng * cosLat;
  const ay = aLat;
  const bx = bLng * cosLat;
  const by = bLat;
  const px = pLng * cosLat;
  const py = pLat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = ax + t * dx;
  const closestY = ay + t * dy;

  const ddx = px - closestX;
  const ddy = py - closestY;
  return {
    distanceMiles: Math.sqrt(ddx * ddx + ddy * ddy) * MILES_PER_DEGREE,
    t,
  };
}

interface MinDistanceResult {
  distanceMiles: number;
  segmentIndex: number;
  t: number;
}

export function minDistanceToPolyline(
  lat: number, lng: number,
  polyline: LatLng[],
): MinDistanceResult {
  if (polyline.length === 0) {
    return { distanceMiles: Infinity, segmentIndex: 0, t: 0 };
  }
  if (polyline.length === 1) {
    const dLat = lat - polyline[0].lat;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const dLng = (lng - polyline[0].lng) * cosLat;
    return {
      distanceMiles: Math.sqrt(dLat * dLat + dLng * dLng) * MILES_PER_DEGREE,
      segmentIndex: 0,
      t: 0,
    };
  }

  let min = Infinity;
  let bestSegment = 0;
  let bestT = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const r = pointToSegment(
      lat, lng,
      polyline[i].lat, polyline[i].lng,
      polyline[i + 1].lat, polyline[i + 1].lng,
    );
    if (r.distanceMiles < min) {
      min = r.distanceMiles;
      bestSegment = i;
      bestT = r.t;
    }
  }
  return { distanceMiles: min, segmentIndex: bestSegment, t: bestT };
}

// ── Park filtering ──────────────────────────────────────────────────────────
// Returns parks within `maxMiles` of the route, sorted in *traversal order*
// (start of route → end), so they can be used as ordered Google Maps waypoints
// and so the trip-planning list reads naturally.
export function findParksAlongRoute<P extends { lat: number; lng: number }>(
  parks: P[],
  encodedPolyline: string,
  maxMiles: number,
): ParkAlongRoute<P>[] {
  const polyline = decodePolyline(encodedPolyline);
  const results: ParkAlongRoute<P>[] = [];
  for (const park of parks) {
    const { distanceMiles, segmentIndex, t } = minDistanceToPolyline(park.lat, park.lng, polyline);
    if (distanceMiles <= maxMiles) {
      results.push({ park, distanceMiles, routeOrderKey: segmentIndex + t });
    }
  }
  results.sort((a, b) => a.routeOrderKey - b.routeOrderKey);
  return results;
}

// ── Routes API call ─────────────────────────────────────────────────────────
export async function fetchRoute(
  origin: string,
  destination: string,
  apiKey: string,
): Promise<RouteResult> {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: "DRIVE",
        polylineQuality: "OVERVIEW",
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Routes API error (${response.status}): ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  // Log the full response so we can see what came back when something goes wrong.
  console.log("[RouteFinder] Routes API response:", data);

  // Routes API can return 200 with an in-body error object.
  if (data?.error) {
    throw new Error(
      `Routes API: ${data.error.message ?? "Unknown error"} (status ${data.error.status ?? "?"})`,
    );
  }

  const route = data?.routes?.[0];
  if (!route?.polyline?.encodedPolyline) {
    throw new Error(
      `No route found. API response: ${JSON.stringify(data).slice(0, 300)}`,
    );
  }

  // duration comes back as a string like "12345s"
  const durationStr: string = route.duration ?? "0s";
  const durationSeconds = parseInt(durationStr.replace(/s$/, ""), 10) || 0;

  return {
    encodedPolyline: route.polyline.encodedPolyline,
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds,
  };
}
