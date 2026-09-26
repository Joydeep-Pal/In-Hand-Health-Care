import mongoose from 'mongoose'

const inventoryItemSchema = new mongoose.Schema({
  medicineId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  unit: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockAt: { type: Number, required: true, min: 0, default: 5 },
}, { _id: false })

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 },
}, { _id: false })

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'retailer'], required: true },
  shopName: { type: String, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  location: locationSchema,
  inventory: { type: [inventoryItemSchema], default: [] },
}, { timestamps: true })

userSchema.index({ role: 1 })
userSchema.index({ 'inventory.medicineId': 1 })

export default mongoose.model('User', userSchema)