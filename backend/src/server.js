import 'dotenv/config'
import mongoose from 'mongoose'
import { createApp } from './app.js'

const { MONGODB_URI, JWT_SECRET } = process.env
if (!MONGODB_URI) throw new Error('MONGODB_URI is required. Copy .env.example to .env and configure MongoDB.')
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.')

await mongoose.connect(MONGODB_URI)
const port = Number(process.env.PORT) || 3000
const server = createApp().listen(port, () => {
  const address = server.address()
  console.log(`Smart Doctor REST API listening on port ${typeof address === 'object' && address ? address.port : port}`)
})

async function shutdown() {
  server.close()
  await mongoose.disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)