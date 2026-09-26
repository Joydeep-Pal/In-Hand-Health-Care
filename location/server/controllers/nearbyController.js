const nearbyService = require('../services/nearbyService');

const ALLOWED_SPECIALTIES = [
  'Cardiologist', 'Dermatologist', 'Endocrinologist', 'ENT Doctor',
  'Gastroenterologist', 'Gynecologist', 'Neurologist', 'Orthopedic Doctor',
  'Pediatrician', 'Psychiatrist', 'Pulmonologist', 'Rheumatologist'
];

/**
 * Validate and parse lat/lng/radius from query string.
 * Returns an object with parsed values or sends a 400 error.
 */
const parseLocationParams = (query, res) => {
  const lat = query.lat === undefined ? NaN : Number(query.lat);
  const lng = query.lng === undefined ? NaN : Number(query.lng);
  const radius = query.radius === undefined ? 5000 : Number(query.radius);
  const requestedSpecialty = typeof query.specialty === 'string' ? query.specialty.trim() : '';
  const specialty = requestedSpecialty
    ? ALLOWED_SPECIALTIES.find((item) => item.toLowerCase() === requestedSpecialty.toLowerCase())
    : null;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({
      success: false,
      message: 'Invalid latitude or longitude. Both must be valid numbers.'
    });
    return null;
  }

  if (lat < -90 || lat > 90) {
    res.status(400).json({
      success: false,
      message: 'Latitude must be between -90 and 90.'
    });
    return null;
  }

  if (lng < -180 || lng > 180) {
    res.status(400).json({
      success: false,
      message: 'Longitude must be between -180 and 180.'
    });
    return null;
  }

  if (!Number.isInteger(radius) || radius < 1 || radius > 50000) {
    res.status(400).json({
      success: false,
      message: 'Radius must be a whole number between 1 and 50000 meters (50 km).'
    });
    return null;
  }

  if (requestedSpecialty && !specialty) {
    res.status(400).json({
      success: false,
      message: 'Unsupported doctor specialty.'
    });
    return null;
  }

  return { lat, lng, radius, specialty };
};

const getNearbyDoctors = async (req, res, next) => {
  try {
    const params = parseLocationParams(req.query, res);
    if (!params) return;

    const data = await nearbyService.getNearbyDoctors(
      params.lat, params.lng, params.radius, params.specialty
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

const getNearbyHospitals = async (req, res, next) => {
  try {
    const params = parseLocationParams(req.query, res);
    if (!params) return;

    const data = await nearbyService.getNearbyHospitals(
      params.lat, params.lng, params.radius
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

const getNearbyMedicalShops = async (req, res, next) => {
  try {
    const params = parseLocationParams(req.query, res);
    if (!params) return;

    const data = await nearbyService.getNearbyMedicalShops(
      params.lat, params.lng, params.radius
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

const getAllNearby = async (req, res, next) => {
  try {
    const params = parseLocationParams(req.query, res);
    if (!params) return;

    const result = await nearbyService.getAllNearby(
      params.lat, params.lng, params.radius, params.specialty
    );

    res.json({
      success: true,
      count: {
        doctors: result.doctors.length,
        hospitals: result.hospitals.length,
        medicalShops: result.medicalShops.length,
        total: result.doctors.length + result.hospitals.length + result.medicalShops.length
      },
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyDoctors,
  getNearbyHospitals,
  getNearbyMedicalShops,
  getAllNearby
};
