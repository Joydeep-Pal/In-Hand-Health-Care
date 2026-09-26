import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Sign in to continue.' })
  }

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET)
    req.auth = { userId: claims.sub, role: claims.role }
    return next()
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Sign in again.' })
  }
}

export function requireRetailer(req, res, next) {
  if (req.auth?.role !== 'retailer') {
    return res.status(403).json({ message: 'Retailer access is required.' })
  }
  return next()
}