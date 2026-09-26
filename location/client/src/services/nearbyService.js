import axios from 'axios';

const API_URL = import.meta.env.VITE_NEARBY_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

export async function getNearbyDoctors(lat, lng, radius, specialty) {
  const params = { lat, lng, radius };
  if (specialty) params.specialty = specialty;
  const { data } = await api.get('/nearby/doctors', { params });
  return data;
}

export async function getNearbyHospitals(lat, lng, radius) {
  const { data } = await api.get('/nearby/hospitals', { params: { lat, lng, radius } });
  return data;
}

export async function getNearbyMedicalShops(lat, lng, radius) {
  const { data } = await api.get('/nearby/medical-shops', { params: { lat, lng, radius } });
  return data;
}

export async function getAllNearby(lat, lng, radius, specialty) {
  const params = { lat, lng, radius };
  if (specialty) params.specialty = specialty;
  const { data } = await api.get('/nearby/all', { params });
  return data;
}

function locationFromCoordinates(latitude, longitude, displayName) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return null
  return { lat, lng, displayName }
}

export function coordinatesFromMapUrl(query) {
  const atCoordinates = query.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  const dataCoordinates = query.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  const queryCoordinates = query.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  const match = atCoordinates || dataCoordinates || queryCoordinates
  return match ? locationFromCoordinates(match[1], match[2], 'Map coordinates') : null
}

/** Search OSM-compatible Photon results, with Nominatim as a fallback provider. */
export async function geocodeLocations(query) {
  const directCoordinates = coordinatesFromMapUrl(query)
  if (directCoordinates) return [directCoordinates]

  try {
    const { data } = await axios.get('https://photon.komoot.io/api/', {
      params: { q: query, limit: 6, lang: 'en' },
      timeout: 10000,
    })
    const photonResults = (data.features || []).map((feature) => {
      const [lng, lat] = feature.geometry?.coordinates || []
      const properties = feature.properties || {}
      const displayName = [properties.name, properties.street, properties.city || properties.county, properties.state, properties.country]
        .filter((value, index, values) => value && values.indexOf(value) === index)
        .join(', ')
      return locationFromCoordinates(lat, lng, displayName || query)
    }).filter(Boolean)
    if (photonResults.length) return photonResults
  } catch {
    // Retry with Nominatim if Photon is unavailable.
  }

  const fallback = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: query, format: 'jsonv2', limit: 5 },
    headers: { 'Accept-Language': 'en' },
    timeout: 10000,
  })
  return fallback.data.map((result) => locationFromCoordinates(result.lat, result.lon, result.display_name)).filter(Boolean)
}

export async function getDrivingRoute(start, destination) {
  const coordinates = `${start.lng},${start.lat};${destination.lng},${destination.lat}`
  const { data } = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordinates}`, {
    params: { overview: 'full', geometries: 'geojson', steps: true },
    timeout: 15000,
  })
  const route = data.routes?.[0]
  if (!route) throw new Error('No driving route is available for this destination.')
  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: route.distance,
    duration: route.duration,
  }
}
