import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, MapPin, MessageCircle, Package, Pill, ScanLine, Stethoscope } from 'lucide-react'

const customerTabs = [
  { to: '/disease-recognizer', label: 'Disease Recognizer', icon: ScanLine },
  { to: '/nearby', label: 'Nearby Healthcare', icon: MapPin },
  { to: '/medicine-finder', label: 'Medicine Finder', icon: Pill },
  { to: '/chatbot', label: 'Chatbot', icon: MessageCircle },
]

export default function Navbar() {
  const isRetailer = localStorage.getItem('sd_role') === 'retailer'
  const tabs = isRetailer
    ? [
        { to: '/retailer/inventory', label: 'Inventory', icon: Package },
        { to: '/medicine-finder', label: 'Medicine Finder', icon: Pill },
        { to: '/nearby', label: 'Nearby Healthcare', icon: MapPin },
      ]
    : customerTabs
  const navigate = useNavigate()

  function signOut() {
    localStorage.removeItem('sd_auth')
    localStorage.removeItem('sd_role')
    localStorage.removeItem('sd_user_email')
    navigate('/login')
  }

  return (
    <nav aria-label="Primary navigation" className="border-b border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3 pt-2 sm:px-5 md:flex md:gap-6 md:px-6 md:py-2">
        <Link
          to={isRetailer ? '/retailer/inventory' : '/disease-recognizer'}
          className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-800 text-white shadow-sm">
            <Stethoscope size={19} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-tight text-slate-900">In-Hand Health Care</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:block">Care workspace</span>
          </span>
        </Link>

        <div className="col-span-2 row-start-2 -mx-3 flex min-w-0 items-center gap-1 overflow-x-auto px-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-5 sm:px-5 md:mx-0 md:flex-1 md:justify-center md:gap-1 md:overflow-visible md:px-0 md:pt-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                title={tab.label}
                className={({ isActive }) =>
                  `group relative flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700 sm:px-3.5 sm:text-sm ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                {tab.label}
              </NavLink>
            )
          })}
        </div>

        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 sm:px-3 md:ml-auto md:text-sm"
        >
          <LogOut size={16} strokeWidth={2} aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </nav>
  )
}
