const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const connectDB = require('../config/db')
const Doctor = require('../models/Doctor')
const Hospital = require('../models/Hospital')
const MedicalShop = require('../models/MedicalShop')

const DATASET_ROOT = path.resolve(__dirname, '../../datasets')
const MODEL_BY_TYPE = { doctor: Doctor, hospital: Hospital, medicalShop: MedicalShop }
const SPECIALTY_FILES = {
  cardiologist: 'Cardiologist',
  dermatologist: 'Dermatologist',
  endocrinologist: 'Endocrinologist',
  ent_doctor: 'ENT Doctor',
  gastroenterologist: 'Gastroenterologist',
  gynecologist: 'Gynecologist',
  neurologist: 'Neurologist',
  orthopedic_doctor: 'Orthopedic Doctor',
  pediatrician: 'Pediatrician',
  psychiatrist: 'Psychiatrist',
  pulmonologist: 'Pulmonologist',
  rheumatologist: 'Rheumatologist',
}
const GENERAL_DOCTOR_LABELS = new Set([
  'doctor', 'medical center', 'medical centre', 'clinic', 'health', 'healthcare',
])

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? listJsonFiles(fullPath) : entry.name.toLowerCase().endsWith('.json') ? [fullPath] : []
  })
}

function getRecordType(filePath, record) {
  const relativePath = path.relative(DATASET_ROOT, filePath).toLowerCase().replaceAll('\\', '/')
  if (relativePath === 'hospital.json') return 'hospital'
  if (relativePath === 'medical shop.json') return 'medicalShop'
  if (relativePath.startsWith('specialties/') || relativePath === 'doctor/specialist_doctors.json') return 'doctor'

  const categories = [record.categoryName, ...(Array.isArray(record.categories) ? record.categories : [])]
    .filter(Boolean).join(' ').toLowerCase()
  if (/pharmacy|medical shop|chemist/.test(categories)) return 'medicalShop'
  if (/hospital/.test(categories)) return 'hospital'
  return 'doctor'
}

function normalizeRecord(record, type, filePath) {
  const name = String(record.title || record.name || '').trim()
  const latitude = Number(record.location?.lat)
  const longitude = Number(record.location?.lng)
  if (!name || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null

  const categoryName = String(record.categoryName || '').trim()
  const fileBase = path.basename(filePath, '.json').toLowerCase()
  const specialty = type === 'doctor'
    ? SPECIALTY_FILES[fileBase]
      || (Array.isArray(record.specialties) ? record.specialties.find(Boolean) : '')
      || (GENERAL_DOCTOR_LABELS.has(categoryName.toLowerCase()) ? '' : categoryName)
    : ''
  const categories = [...new Set([
    ...(Array.isArray(record.categories) ? record.categories : []),
    ...(categoryName ? [categoryName] : []),
  ].map((item) => String(item).trim()).filter(Boolean))]
  const placeId = record.placeId ? String(record.placeId).trim() : ''
  const fallback = [name.toLowerCase(), record.address || '', latitude, longitude].join('|').toLowerCase()
  const dedupeKey = placeId || crypto.createHash('sha256').update(fallback).digest('hex')
  const openingHours = Array.isArray(record.openingHours)
    ? record.openingHours.filter((item) => item && item.day && item.hours).map(({ day, hours }) => ({ day: String(day), hours: String(hours) }))
    : []

  return {
    name,
    subtitle: record.subTitle || record.subtitle || '',
    description: record.description || '',
    ...(type === 'doctor' && { specialty, category: categoryName }),
    address: record.address || '',
    neighborhood: record.neighborhood || '',
    street: record.street || '',
    city: record.city || '',
    postalCode: record.postalCode || '',
    state: record.state || '',
    country: record.countryCode || record.country || 'IN',
    phone: record.phone || '',
    website: record.website || '',
    rating: Number.isFinite(Number(record.totalScore)) ? Number(record.totalScore) : 0,
    reviewsCount: Number.isFinite(Number(record.reviewsCount)) ? Number(record.reviewsCount) : 0,
    ...(placeId && { placeId }),
    dedupeKey,
    categories,
    openingHours,
    location: { type: 'Point', coordinates: [longitude, latitude] },
  }
}

function mergeDuplicate(existing, next) {
  const merged = { ...existing }
  for (const [key, value] of Object.entries(next)) {
    if (key === 'specialty') {
      if (!merged.specialty || GENERAL_DOCTOR_LABELS.has(merged.specialty.toLowerCase())) merged.specialty = value
      continue
    }
    if (Array.isArray(value)) merged[key] = [...new Set([...(merged[key] || []), ...value])]
    else if (value !== '' && value !== null && value !== undefined && value !== 0) merged[key] = value
  }
  return merged
}

async function importDataset() {
  if (!fs.existsSync(DATASET_ROOT)) throw new Error(`Dataset directory not found: ${DATASET_ROOT}`)
  console.log('Starting dataset import...')
  await connectDB()

  const stats = {
    read: { doctor: 0, hospital: 0, medicalShop: 0 },
    skipped: { invalidRecords: 0, malformedFiles: 0 },
    duplicates: { doctor: 0, hospital: 0, medicalShop: 0 },
    imported: { doctor: 0, hospital: 0, medicalShop: 0 },
  }
  const recordsByType = { doctor: new Map(), hospital: new Map(), medicalShop: new Map() }

  for (const filePath of listJsonFiles(DATASET_ROOT)) {
    let records
    try {
      records = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      if (!Array.isArray(records)) throw new Error('JSON root must be an array')
    } catch (error) {
      stats.skipped.malformedFiles += 1
      console.warn(`Skipping malformed dataset ${path.relative(DATASET_ROOT, filePath)}: ${error.message}`)
      continue
    }

    for (const record of records) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        stats.skipped.invalidRecords += 1
        continue
      }
      const type = getRecordType(filePath, record)
      stats.read[type] += 1
      const normalized = normalizeRecord(record, type, filePath)
      if (!normalized) {
        stats.skipped.invalidRecords += 1
        continue
      }
      const recordsForType = recordsByType[type]
      if (recordsForType.has(normalized.dedupeKey)) {
        stats.duplicates[type] += 1
        recordsForType.set(normalized.dedupeKey, mergeDuplicate(recordsForType.get(normalized.dedupeKey), normalized))
      } else {
        recordsForType.set(normalized.dedupeKey, normalized)
      }
    }
  }

  for (const [type, Model] of Object.entries(MODEL_BY_TYPE)) {
    await Model.init()
    const records = [...recordsByType[type].values()]
    stats.imported[type] = records.length
    for (let offset = 0; offset < records.length; offset += 500) {
      const batch = records.slice(offset, offset + 500)
      const operations = batch.map((record) => ({
        updateOne: {
          filter: record.placeId ? { placeId: record.placeId } : { dedupeKey: record.dedupeKey },
          update: { $set: record },
          upsert: true,
        },
      }))
      await Model.bulkWrite(operations, { ordered: false })
    }
  }

  console.log('\nRecords found:')
  for (const type of Object.keys(MODEL_BY_TYPE)) console.log(`${type}: ${stats.read[type]}`)
  console.log('\nDuplicates removed:')
  for (const type of Object.keys(MODEL_BY_TYPE)) console.log(`${type}: ${stats.duplicates[type]}`)
  console.log(`Invalid records skipped: ${stats.skipped.invalidRecords}`)
  console.log(`Malformed files skipped: ${stats.skipped.malformedFiles}`)
  console.log('\nImported/upserted:')
  for (const type of Object.keys(MODEL_BY_TYPE)) console.log(`${type}: ${stats.imported[type]}`)
  console.log('\nDatabase import completed successfully.')
  await require('mongoose').disconnect()
}

importDataset().catch(async (error) => {
  console.error(`Dataset import failed: ${error.message}`)
  await require('mongoose').disconnect()
  process.exitCode = 1
})