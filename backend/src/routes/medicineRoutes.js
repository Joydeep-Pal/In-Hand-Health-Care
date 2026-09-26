import { Router } from 'express'
import { z } from 'zod'
import User from '../models/User.js'
import { MEDICINES } from '../data/medicineCatalog.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseBody } from '../utils/validation.js'

const router = Router()
const searchSchema = z.object({
  medicines: z.array(z.object({
    medicineId: z.string().trim().min(1).max(100),
    quantity: z.number().int().positive().max(1000000),
  })).min(1).max(30),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
})

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function distanceKm(first, second) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const latitudeDelta = radians(second.latitude - first.latitude)
  const longitudeDelta = radians(second.longitude - first.longitude)
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude))
    * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

router.get('/medicines', asyncHandler(async (req, res) => {
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : ''
  const matchesCatalog = MEDICINES.filter((medicine) =>
    medicine.name.toLowerCase().includes(query.toLowerCase()),
  )
  const retailerItems = await User.aggregate([
    { $match: { role: 'retailer' } },
    { $unwind: '$inventory' },
    ...(query ? [{ $match: { 'inventory.name': { $regex: escapeRegex(query), $options: 'i' } } }] : []),
    { $group: { _id: '$inventory.medicineId', name: { $first: '$inventory.name' }, unit: { $first: '$inventory.unit' } } },
  ])
  const options = new Map(matchesCatalog.map((medicine) => [medicine.id, medicine]))
  for (const item of retailerItems) {
    if (!options.has(item._id)) options.set(item._id, { id: item._id, name: item.name, unit: item.unit })
  }
  return res.json({ medicines: [...options.values()] })
}))

router.post('/medicine-search', asyncHandler(async (req, res) => {
  const { medicines, location } = parseBody(searchSchema, req.body)
  const requestedById = new Map(medicines.map((medicine) => [medicine.medicineId, medicine.quantity]))
  const retailers = await User.find({
    role: 'retailer',
    'inventory.medicineId': { $in: [...requestedById.keys()] },
  }).select('shopName phone address location inventory')

  const shops = retailers.map((retailer) => {
    const items = medicines.map((requested) => {
      const stocked = retailer.inventory.find((item) => item.medicineId === requested.medicineId)
      const catalogMedicine = MEDICINES.find((medicine) => medicine.id === requested.medicineId)
      const availableQuantity = stocked?.stock ?? 0
      return {
        medicineId: requested.medicineId,
        name: stocked?.name ?? catalogMedicine?.name ?? requested.medicineId,
        unit: stocked?.unit ?? catalogMedicine?.unit ?? 'unit',
        requestedQuantity: requested.quantity,
        availableQuantity,
        hasEnough: availableQuantity >= requested.quantity,
      }
    })
    const availableCount = items.filter((item) => item.availableQuantity > 0).length
    const hasEverything = items.every((item) => item.hasEnough)
    const shopLocation = retailer.location?.latitude != null && retailer.location?.longitude != null
      ? { latitude: retailer.location.latitude, longitude: retailer.location.longitude }
      : null
    const distance = location && shopLocation ? distanceKm(location, shopLocation) : null

    return {
      shopId: retailer.id,
      name: retailer.shopName,
      phone: retailer.phone,
      address: retailer.address,
      distanceKm: distance == null ? null : Math.round(distance * 10) / 10,
      availability: hasEverything ? 'full' : 'partial',
      availableCount,
      hasEverything,
      items,
    }
  }).filter((shop) => shop.availableCount > 0)
    .sort((first, second) => (first.distanceKm ?? Infinity) - (second.distanceKm ?? Infinity))

  return res.json({ shops })
}))

export default router