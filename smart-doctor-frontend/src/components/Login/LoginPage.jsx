import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import { loginAccount, registerAccount } from '../../api.js'

export default function LoginPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [accountType, setAccountType] = useState('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password || (mode === 'signup' && accountType === 'retailer' && (!shopName || !phone || !address))) {
      setError(mode === 'signup' && accountType === 'retailer'
        ? 'Complete your email, password, and shop details to register.'
        : 'Enter both fields to continue.')
      return
    }
    const normalizedEmail = email.trim().toLowerCase()
    setSubmitting(true)
    setError('')
    try {
      const account = {
        role: accountType,
        email: normalizedEmail,
        password,
        ...(accountType === 'retailer' && mode === 'signup' && {
          shopName: shopName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      }
      const response = mode === 'signup'
        ? await registerAccount(account)
        : await loginAccount(account)
      localStorage.setItem('sd_auth', response.token)
      localStorage.setItem('sd_role', response.user.role)
      localStorage.setItem('sd_user_email', response.user.email)
      navigate(response.user.role === 'retailer' ? '/retailer/inventory' : '/disease-recognizer')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Stethoscope className="w-6 h-6 text-teal-500" />
          <span className="text-lg font-semibold tracking-tight">In-Hand Health Care</span>
        </div>

        <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
          {/* Sign in / Sign up tab switch */}
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`py-3 text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-teal-500 text-white'
                  : 'bg-teal-50 text-slate-soft hover:bg-teal-100'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-3 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-teal-500 text-white'
                  : 'bg-teal-50 text-slate-soft hover:bg-teal-100'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <fieldset>
              <legend className="mb-2 block text-sm text-slate-soft">I am joining as a</legend>
              <div className="grid grid-cols-2 border border-teal-100">
                {[
                  { value: 'customer', label: 'Customer' },
                  { value: 'retailer', label: 'Retailer' },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => { setAccountType(role.value); setError('') }}
                    aria-pressed={accountType === role.value}
                    className={`py-2 text-sm font-medium transition-colors ${accountType === role.value ? 'bg-teal-50 text-teal-600' : 'text-slate-soft hover:bg-teal-50'}`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {mode === 'signup' && accountType === 'retailer' && (
              <div className="space-y-4 border-y border-teal-100 py-4">
                <p className="text-sm font-medium">Shop details</p>
                <div>
                  <label className="mb-1 block text-sm text-slate-soft" htmlFor="shop-name">Shop name</label>
                  <input id="shop-name" value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="Your pharmacy name" className="w-full rounded-lg border border-teal-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-soft" htmlFor="shop-phone">Contact number</label>
                  <input id="shop-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Shop phone number" className="w-full rounded-lg border border-teal-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-soft" htmlFor="shop-address">Shop address</label>
                  <input id="shop-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, area, city" className="w-full rounded-lg border border-teal-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-soft mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-teal-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-soft mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-teal-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            {error && <p role="alert" className="text-sm text-alert-text">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-teal-500 text-white font-medium py-2.5 text-sm hover:bg-teal-600 transition-colors"
            >
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : accountType === 'retailer' ? 'Register shop' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-soft text-center mt-6">
          Educational tool only — not a substitute for professional medical care.
        </p>
      </div>
    </div>
  )
}
