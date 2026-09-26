import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import { DEMO_RETAILERS } from '../src/data/demoRetailers.js'

const { MONGODB_URI } = process.env
const allowRemote = process.argv.includes('--allow-remote')
const isLocalMongo = /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(MONGODB_URI || '')

if (!MONGODB_URI) throw new Error('MONGODB_URI is required. Configure backend/.env first.')
if (!isLocalMongo && !allowRemote) {
  throw new Error('Refusing to seed a remote database. Pass --allow-remote to confirm explicitly.')
}

try {
  await mongoose.connect(MONGODB_URI)
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
  let inserted = 0
  let unchanged = 0

  for (const retailer of DEMO_RETAILERS) {
    const result = await User.updateOne(
      { email: retailer.email },
      {
        $setOnInsert: {
          ...retailer,
          role: 'retailer',
          passwordHash,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
    inserted += result.upsertedCount
    unchanged += result.matchedCount
  }

  console.log(`Demo retailer seed complete: ${inserted} added, ${unchanged} already present.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}