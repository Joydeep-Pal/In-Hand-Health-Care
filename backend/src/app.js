import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import retailerRoutes from './routes/retailerRoutes.js'
import medicineRoutes from './routes/medicineRoutes.js'

export function createApp() {
  const app = express()
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('This origin is not allowed by CORS.'))
  } }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
  })

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false })
  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/retailers', retailerRoutes)
  app.use('/api', medicineRoutes)

  app.use((req, res) => res.status(404).json({ message: 'API endpoint not found.' }))
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' })
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message })
    if (error.message?.includes('CORS')) return res.status(403).json({ message: error.message })
    const status = Number.isInteger(error.status) ? error.status : 500
    if (status === 500) console.error(error)
    return res.status(status).json({ message: status === 500 ? 'An unexpected server error occurred.' : error.message })
  })

  return app
}