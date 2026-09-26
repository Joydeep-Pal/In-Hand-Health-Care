import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseBody } from '../utils/validation.js'

const router = Router()

const registerSchema = z.object({
  role: z.enum(['customer', 'retailer']),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
  shopName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(5).max(40).optional(),
  address: z.string().trim().min(4).max(240).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
}).superRefine((account, context) => {
  if (account.role === 'retailer') {
    for (const field of ['shopName', 'phone', 'address']) {
      if (!account[field]) {
        context.addIssue({ code: 'custom', message: `${field} is required for retailer registration.` })
      }
    }
  }
})

const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72),
  role: z.enum(['customer', 'retailer']),
})

function createToken(user) {
  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    { subject: user.id, expiresIn: '7d' },
  )
}

function accountResponse(user) {
  return {
    token: createToken(user),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.role === 'retailer' && {
        shop: {
          shopName: user.shopName,
          phone: user.phone,
          address: user.address,
          location: user.location,
          inventory: user.inventory,
        },
      }),
    },
  }
}

router.post('/register', asyncHandler(async (req, res) => {
  const account = parseBody(registerSchema, req.body)
  const passwordHash = await bcrypt.hash(account.password, 12)
  const user = await User.create({
    ...account,
    passwordHash,
    ...(account.role === 'retailer' ? {} : { shopName: undefined, phone: undefined, address: undefined, location: undefined }),
  })
  return res.status(201).json(accountResponse(user))
}))

router.post('/login', asyncHandler(async (req, res) => {
  const credentials = parseBody(loginSchema, req.body)
  const user = await User.findOne({ email: credentials.email, role: credentials.role }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' })
  }
  return res.json(accountResponse(user))
}))

export default router