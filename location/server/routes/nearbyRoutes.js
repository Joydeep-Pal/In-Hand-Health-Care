const express = require('express')
const nearbyController = require('../controllers/nearbyController')

const router = express.Router()

router.get('/doctors', nearbyController.getNearbyDoctors)
router.get('/hospitals', nearbyController.getNearbyHospitals)
router.get('/medical-shops', nearbyController.getNearbyMedicalShops)
router.get('/all', nearbyController.getAllNearby)

module.exports = router