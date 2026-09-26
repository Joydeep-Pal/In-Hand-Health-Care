import { useEffect, useState } from 'react'
import { Check, MapPin, Minus, Plus, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { getMedicineOptions, searchMedicineShops } from '../../api.js'
import { formatUnits, pluralizeUnit } from '../../data/medicineCatalog.js'

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 },
    )
  })
}

export default function MedicineFinderPage() {
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [onlyComplete, setOnlyComplete] = useState(false)
  const [medicineOptions, setMedicineOptions] = useState([])
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!query.trim()) {
      setMedicineOptions([])
      return undefined
    }
    let isCurrent = true
    const timer = setTimeout(() => {
      getMedicineOptions(query.trim())
        .then(({ medicines }) => { if (isCurrent) setMedicineOptions(medicines) })
        .catch((searchError) => { if (isCurrent) setError(searchError.message) })
    }, 200)
    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [query])

  const suggestions = query
    ? medicineOptions.filter((medicine) =>
        medicine.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        !cart.some((item) => item.id === medicine.id),
      )
    : []

  const matchingShops = results.filter((shop) => !onlyComplete || shop.hasEverything)

  async function handleFindStores() {
    setSearching(true)
    setError('')
    try {
      const location = await getCurrentLocation()
      const response = await searchMedicineShops(
        cart.map((medicine) => ({ medicineId: medicine.id, quantity: medicine.qty })),
        location,
      )
      setResults(response.shops.map((shop) => ({
        ...shop,
        items: shop.items.map((item) => ({
          ...item,
          id: item.medicineId,
          qty: item.requestedQuantity,
          stock: item.availableQuantity,
        })),
      })))
      setHasSearched(true)
    } catch (searchError) {
      setError(searchError.message)
      setHasSearched(false)
    } finally {
      setSearching(false)
    }
  }

  function addToCart(med) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === med.id)
      if (existing) {
        return prev.map((c) => (c.id === med.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { ...med, qty: 1 }]
    })
    setHasSearched(false)
    setResults([])
    setError('')
    setQuery('')
  }

  function updateQty(id, delta) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    )
    setHasSearched(false)
    setResults([])
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-9">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-teal-100 pb-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-600">Local pharmacy search</p>
          <h1 className="text-2xl font-semibold text-ink">Find your medicines</h1>
          <p className="mt-1 text-sm text-slate-soft">Build a list and see which nearby shops can fill it.</p>
        </div>
        <span className="rounded-sm bg-white px-2.5 py-1.5 text-xs text-slate-soft ring-1 ring-teal-100">Live retailer inventory</span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Medicine and shop search">
          <label htmlFor="medicine-search" className="mb-2 block text-sm font-medium">Search medicines</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-soft" />
            <input
              id="medicine-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a medicine name"
              autoComplete="off"
              className="w-full rounded-md border border-teal-100 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
            {query && (
              <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto border border-teal-100 bg-white shadow-lg">
                {suggestions.length > 0 ? suggestions.map((medicine) => (
                  <button
                    key={medicine.id}
                    type="button"
                    onClick={() => addToCart(medicine)}
                    className="flex w-full items-center justify-between border-b border-teal-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-teal-50"
                  >
                    <span>{medicine.name}</span>
                    <span className="text-xs text-teal-600">Add</span>
                  </button>
                )) : (
                  <p className="px-4 py-3 text-sm text-slate-soft">No matching medicines listed yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Nearby shops</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-soft">
                <input
                  type="checkbox"
                  checked={onlyComplete}
                  onChange={(event) => setOnlyComplete(event.target.checked)}
                  className="h-4 w-4 accent-teal-500"
                />
                All medicines in stock
              </label>
            </div>

            {!hasSearched ? (
              <div className="border-y border-teal-100 py-10 text-center">
                <ShoppingBag className="mx-auto mb-3 h-6 w-6 text-teal-400" />
                <p className="text-sm font-medium">Your shop matches will appear here</p>
                <p className="mt-1 text-xs text-slate-soft">Add medicines to your list, then search nearby inventory.</p>
              </div>
            ) : matchingShops.length > 0 ? (
              <div className="divide-y divide-teal-100 border-y border-teal-100">
                {matchingShops.map((shop) => (
                  <article key={shop.shopId} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold">{shop.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-soft">
                          <MapPin className="h-3.5 w-3.5" />{shop.address}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-soft">
                          <MapPin className="h-3.5 w-3.5 text-teal-500" />{shop.distanceKm == null ? 'Distance unavailable' : `${shop.distanceKm.toFixed(1)} km`}
                      </span>
                    </div>
                    <p className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${shop.hasEverything ? 'text-teal-600' : 'text-amber-700'}`}>
                      {shop.hasEverything ? <Check className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
                      {shop.hasEverything ? 'All requested quantities available' : `${shop.availableCount} of ${cart.length} medicines available`}
                    </p>
                    <ul className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                      {shop.items.map((item) => (
                        <li key={item.medicineId} className="flex justify-between gap-2 text-xs">
                          <span className="text-slate-soft">{item.name} <span className="text-ink">× {item.qty}</span></span>
                          <span className={item.stock >= item.qty ? 'font-medium text-teal-600' : item.stock > 0 ? 'font-medium text-amber-700' : 'text-alert-text'}>
                            {item.stock >= item.qty ? formatUnits(item.stock, item.unit) : item.stock > 0 ? `${formatUnits(item.stock, item.unit)} in stock` : 'Out of stock'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <div className="border-y border-teal-100 py-10 text-center">
                <p className="text-sm font-medium">No shops match this list</p>
                <p className="mt-1 text-xs text-slate-soft">Try turning off the complete-stock filter or reducing quantities.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="border border-teal-100 bg-white p-4 sm:p-5 lg:sticky lg:top-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Your list</h2>
            <span className="text-xs text-slate-soft">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
          </div>
          {cart.length ? (
            <ul className="divide-y divide-teal-50">
              {cart.map((medicine) => (
                <li key={medicine.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{medicine.name}</p>
                    <p className="mt-0.5 text-xs text-slate-soft">Quantity in {pluralizeUnit(medicine.unit)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" aria-label={`Remove one ${medicine.name}`} onClick={() => updateQty(medicine.id, -1)} className="grid h-8 w-8 place-items-center border border-teal-100 text-teal-600 hover:bg-teal-50">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm tabular-nums">{medicine.qty}</span>
                    <button type="button" aria-label={`Add one ${medicine.name}`} onClick={() => updateQty(medicine.id, 1)} className="grid h-8 w-8 place-items-center border border-teal-100 text-teal-600 hover:bg-teal-50">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-y border-dashed border-teal-100 py-7 text-center">
              <p className="text-sm text-slate-soft">No medicines added yet.</p>
            </div>
          )}
          <button
            type="button"
            disabled={!cart.length || searching}
            onClick={handleFindStores}
            className="mt-4 w-full bg-teal-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-teal-100 disabled:text-slate-soft"
          >
            {searching ? 'Searching…' : 'Find matching shops'}
          </button>
          {error && <p role="alert" className="mt-3 text-xs text-alert-text">{error}</p>}
          <p className="mt-3 text-center text-[11px] leading-4 text-slate-soft">Allow location access to sort shops by distance. Distances require shop coordinates.</p>
        </aside>
      </div>
    </div>
  )
}
