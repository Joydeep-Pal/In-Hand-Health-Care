import { Router } from 'express'
import { z } from 'zod'
import User from '../models/User.js'
import { requireAuth, requireRetailer } from '../middleware/requireAuth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseBody } from '../utils/validation.js'

const router = Router()
const addStockSchema = z.object({
  medicineId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  unit: z.string().trim().min(1).max(30),
  quantity: z.number().int().positive().max(1000000),
  lowStockAt: z.number().int().nonnegative().max(1000000).default(5),
})
const updateStockSchema = z.object({
  stock: z.number().int().nonnegative().max(1000000),
})
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

router.use(requireAuth, requireRetailer)

router.get('/me', asyncHandler(async (req, res) => {
  const retailer = await User.findById(req.auth.userId).select('-email')
  if (!retailer) return res.status(404).json({ message: 'Retailer account not found.' })
  return res.json({ retailer })
}))

router.patch('/me/location', asyncHandler(async (req, res) => {
  const location = parseBody(locationSchema, req.body)
  const retailer = await User.findByIdAndUpdate(
    req.auth.userId,
    { $set: { location } },
    { new: true, runValidators: true },
  )
  if (!retailer) return res.status(404).json({ message: 'Retailer account not found.' })
  return res.json({ retailer })
}))

router.post('/me/inventory', asyncHandler(async (req, res) => {
  const addition = parseBody(addStockSchema, req.body)
  const retailer = await User.findById(req.auth.userId)
  if (!retailer) return res.status(404).json({ message: 'Retailer account not found.' })
  const existing = retailer.inventory.find((item) => item.medicineId === addition.medicineId)
  if (existing) {
    existing.stock += addition.quantity
    existing.lowStockAt = addition.lowStockAt
    existing.name = addition.name
    existing.unit = addition.unit
  } else {
    retailer.inventory.push({
      medicineId: addition.medicineId,
      name: addition.name,
      unit: addition.unit,
      stock: addition.quantity,
      lowStockAt: addition.lowStockAt,
    })
  }
  await retailer.save()
  return res.status(201).json({ retailer })
}))

router.patch('/me/inventory/:medicineId', asyncHandler(async (req, res) => {
  const { stock } = parseBody(updateStockSchema, req.body)
  const retailer = await User.findById(req.auth.userId)
  const item = retailer?.inventory.find((entry) => entry.medicineId === req.params.medicineId)
  if (!item) return res.status(404).json({ message: 'Medicine not found in this inventory.' })
  item.stock = stock
  await retailer.save()
  return res.json({ retailer })
}))

router.delete('/me/inventory/:medicineId', asyncHandler(async (req, res) => {
  const retailer = await User.findById(req.auth.userId)
  if (!retailer) return res.status(404).json({ message: 'Retailer account not found.' })
  const itemCount = retailer.inventory.length
  retailer.inventory = retailer.inventory.filter((item) => item.medicineId !== req.params.medicineId)
  if (retailer.inventory.length === itemCount) {
    return res.status(404).json({ message: 'Medicine not found in this inventory.' })
  }
  await retailer.save()
  return res.json({ retailer })
}))

export default router