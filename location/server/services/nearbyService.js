const Doctor = require('../models/Doctor')
const Hospital = require('../models/Hospital')
const MedicalShop = require('../models/MedicalShop')

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function findNearby(Model, type, lat, lng, radius, specialty) {
  const query = {}
  if (specialty && type === 'doctor') {
    const pattern = new RegExp(`^${escapeRegex(specialty)}$`, 'i')
    query.$or = [{ specialty: pattern }, { category: pattern }, { categories: pattern }]
  }

  const places = await Model.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: radius,
        spherical: true,
        query,
      },
    },
    {
      $project: {
        name: 1,
        subtitle: 1,
        description: 1,
        specialty: 1,
        category: 1,
        address: 1,
        neighborhood: 1,
        street: 1,
        city: 1,
        postalCode: 1,
        state: 1,
        country: 1,
        phone: 1,
        website: 1,
        rating: 1,
        reviewsCount: 1,
        placeId: 1,
        categories: 1,
        openingHours: 1,
        location: 1,
        distanceMeters: 1,
      },
    },
  ])

  return places.map((place) => ({
    id: String(place._id),
    name: place.name,
    type,
    subtitle: place.subtitle || '',
    description: place.description || '',
    specialty: place.specialty || '',
    category: place.category || '',
    address: place.address || '',
    neighborhood: place.neighborhood || '',
    street: place.street || '',
    city: place.city || '',
    postalCode: place.postalCode || '',
    state: place.state || '',
    country: place.country || '',
    phone: place.phone || '',
    website: place.website || '',
    rating: place.rating || 0,
    reviewsCount: place.reviewsCount || 0,
    placeId: place.placeId || '',
    categories: place.categories || [],
    openingHours: place.openingHours || [],
    location: {
      lat: place.location.coordinates[1],
      lng: place.location.coordinates[0],
    },
    distance: Math.round(place.distanceMeters / 100) / 10,
  }))
}

async function getNearbyDoctors(lat, lng, radius, specialty) {
  return findNearby(Doctor, 'doctor', lat, lng, radius, specialty)
}

async function getNearbyHospitals(lat, lng, radius) {
  return findNearby(Hospital, 'hospital', lat, lng, radius)
}

async function getNearbyMedicalShops(lat, lng, radius) {
  return findNearby(MedicalShop, 'medicalShop', lat, lng, radius)
}

async function getAllNearby(lat, lng, radius, specialty) {
  const [doctors, hospitals, medicalShops] = await Promise.all([
    getNearbyDoctors(lat, lng, radius, specialty),
    getNearbyHospitals(lat, lng, radius),
    getNearbyMedicalShops(lat, lng, radius),
  ])
  return { doctors, hospitals, medicalShops }
}

module.exports = {
  getNearbyDoctors,
  getNearbyHospitals,
  getNearbyMedicalShops,
  getAllNearby,
}