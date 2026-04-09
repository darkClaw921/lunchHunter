/**
 * Geographic utilities for radius search.
 *
 * All distances are in meters, all coordinates in WGS84 decimal degrees.
 */

const EARTH_RADIUS_METERS = 6_371_000;
const DEG_TO_RAD = Math.PI / 180;
const METERS_PER_DEG_LAT = 111_000;

/**
 * Great-circle distance between two points using the Haversine formula.
 * @returns distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const phi1 = lat1 * DEG_TO_RAD;
  const phi2 = lat2 * DEG_TO_RAD;
  const deltaPhi = (lat2 - lat1) * DEG_TO_RAD;
  const deltaLambda = (lng2 - lng1) * DEG_TO_RAD;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Approximate bounding box around a point for a given radius in meters.
 * Use this to pre-filter candidates via R*Tree before refining with haversine.
 *
 * lat delta: R / 111000
 * lng delta: R / (111000 * cos(lat))
 */
export function bboxFromRadius(
  lat: number,
  lng: number,
  radiusMeters: number,
): BoundingBox {
  const latDelta = radiusMeters / METERS_PER_DEG_LAT;
  const lngDelta =
    radiusMeters / (METERS_PER_DEG_LAT * Math.cos(lat * DEG_TO_RAD));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
