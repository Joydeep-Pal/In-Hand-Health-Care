const mongoose = require('mongoose');

const medicalShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtitle: String,
  description: String,
  address: String,
  neighborhood: String,
  street: String,
  city: String,
  postalCode: String,
  state: String,
  country: { type: String, default: 'IN' },
  phone: String,
  website: String,
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  placeId: { type: String, unique: true, sparse: true },
  dedupeKey: { type: String, unique: true, sparse: true },
  categories: [String],
  openingHours: [{ day: String, hours: String }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
}, { timestamps: true });

medicalShopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MedicalShop', medicalShopSchema);
