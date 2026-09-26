export function getDirectionsUrl(origin, destination) {
  const route = `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`
}

/**
 * Format distance in km for display.
 */
export function formatDistance(distKm) {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}
