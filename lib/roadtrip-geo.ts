export type RouteCoordinate = readonly [longitude: number, latitude: number];
export type GeoPoint = { longitude: number; latitude: number };
const METERS_PER_MILE = 1609.344;
const METERS_PER_DEGREE_LATITUDE = 111_320;

function distanceMeters(a: RouteCoordinate, b: RouteCoordinate): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const lat1 = radians(a[1]), lat2 = radians(b[1]);
  const dLat = lat2 - lat1, dLon = radians(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Sample a route polyline at approximately even distance intervals. */
export function sampleRouteByDistance(coordinates: readonly RouteCoordinate[], maxSpacingMiles = 45, maxSamples = 18): GeoPoint[] {
  if (coordinates.length < 2 || maxSpacingMiles <= 0 || maxSamples < 2) return [];
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i += 1) {
    cumulative.push(cumulative[i - 1] + distanceMeters(coordinates[i - 1], coordinates[i]));
  }
  const totalMeters = cumulative[cumulative.length - 1];
  if (!Number.isFinite(totalMeters) || totalMeters <= 0) return [];
  const desiredCount = Math.max(2, Math.ceil(totalMeters / (maxSpacingMiles * METERS_PER_MILE)) + 1);
  const count = Math.min(maxSamples, desiredCount);
  const samples: GeoPoint[] = [];
  let segmentIndex = 1;
  for (let i = 0; i < count; i += 1) {
    const target = totalMeters * i / (count - 1);
    while (segmentIndex < cumulative.length - 1 && cumulative[segmentIndex] < target) segmentIndex += 1;
    const segmentStart = cumulative[segmentIndex - 1], segmentEnd = cumulative[segmentIndex];
    const segmentLength = segmentEnd - segmentStart;
    const fraction = segmentLength > 0 ? (target - segmentStart) / segmentLength : 0;
    const start = coordinates[segmentIndex - 1], end = coordinates[segmentIndex];
    samples.push({
      longitude: start[0] + (end[0] - start[0]) * fraction,
      latitude: start[1] + (end[1] - start[1]) * fraction,
    });
  }
  return samples;
}

/** Shortest point-to-polyline distance, using a local projection suitable for US routes. */
export function distanceFromPointToRouteMiles(point: GeoPoint, coordinates: readonly RouteCoordinate[]): number {
  if (coordinates.length < 2) return Number.POSITIVE_INFINITY;
  const latitudeScale = Math.cos(point.latitude * Math.PI / 180);
  const toLocalMeters = (coordinate: RouteCoordinate): [number, number] => [
    (coordinate[0] - point.longitude) * latitudeScale * METERS_PER_DEGREE_LATITUDE,
    (coordinate[1] - point.latitude) * METERS_PER_DEGREE_LATITUDE,
  ];
  let minimumSquared = Number.POSITIVE_INFINITY;
  for (let i = 1; i < coordinates.length; i += 1) {
    const [ax, ay] = toLocalMeters(coordinates[i - 1]), [bx, by] = toLocalMeters(coordinates[i]);
    const dx = bx - ax, dy = by - ay, lengthSquared = dx * dx + dy * dy;
    const projection = lengthSquared > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared)) : 0;
    const closestX = ax + projection * dx, closestY = ay + projection * dy;
    minimumSquared = Math.min(minimumSquared, closestX * closestX + closestY * closestY);
  }
  return Math.sqrt(minimumSquared) / METERS_PER_MILE;
}
