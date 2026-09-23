export interface GeoPoint {
  lat: number;
  lng: number;
}

// Distância entre duas coordenadas (fórmula de Haversine) — padrão pra medir
// distância sobre a superfície da Terra a partir de lat/long.
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const EARTH_RADIUS_M = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Ritmo em minutos por quilômetro. `0` (sem ritmo ainda) quando não há
// distância percorrida, em vez de `Infinity`/`NaN`.
export function calculatePaceMinPerKm(distanceMeters: number, elapsedSeconds: number): number {
  const distanceKm = distanceMeters / 1000;
  return distanceKm > 0 ? elapsedSeconds / 60 / distanceKm : 0;
}
