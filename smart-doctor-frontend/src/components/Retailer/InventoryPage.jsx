import { useEffect, useState } from 'react'
import { AlertTriangle, Boxes, MapPin, Minus, PackagePlus, Plus, Search, Trash2 } from 'lucide-react'
import { addInventoryStock, deleteInventoryItem, getRetailerProfile, updateInventoryStock, updateRetailerLocation } from '../../api.js'
import { formatUnits, MEDICINES } from '../../data/medicineCatalog.js'

export default function InventoryPage() {
  const [retailer, setRetailer] = useState(null)
  const [medicineId, setMedicineId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customUnit, setCustomUnit] = useState('pack')
  const [quantity, setQuantity] = useState('')
  const [lowStockAt, setLowStockAt] = useState('5')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const inventory = retailer?.inventory || []
  const visibleInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const lowStockCount = inventory.filter((item) => item.stock <= item.lowStockAt).length
  const totalUnits = inventory.reduce((total, item) => total + item.stock, 0)

  useEffect(() => {
    let isCurrent = true
    getRetailerProfile()
      .then(({ retailer: profile }) => {
        if (isCurrent) {
          setRetailer({
            ...profile,
            inventory: profile.inventory.map((item) => ({ ...item, id: item.medicineId })),
          })
        }
      })
      .catch((loadError) => { if (isCurrent) setError(loadError.message) })
      .finally(() => { if (isCurrent) setLoading(false) })
    return () => { isCurrent = false }
  }, [])

  function applyRetailerResponse(response) {
    setRetailer({
      ...response.retailer,
      inventory: response.retailer.inventory.map((item) => ({ ...item, id: item.medicineId })),
    })
  }

  function setShopLocation() {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser.')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await updateRetailerLocation({ latitude: coords.latitude, longitude: coords.longitude })
        applyRetailerResponse(response)
      } catch (locationError) {
        setError(locationError.message)
      } finally {
        setLocating(false)
      }
    }, (locationError) => {
      setError(locationError.message || 'Could not read this device location.')
      setLocating(false)
    }, { enableHighAccuracy: true, timeout: 10000 })
  }

  async function addMedicine(event) {
    event.preventDefault()
    const catalogMedicine = MEDICINES.find((item) => item.id === medicineId)
    const addedQuantity = Number(quantity)
    const alertThreshold = Number(lowStockAt)
    const customSlug = customName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const medicine = catalogMedicine || (medicineId === 'custom' && customSlug
      ? { id: `custom-${customSlug}`, name: customName.trim(), unit: customUnit.trim() || 'pack' }
      : null)
    if (!medicine || !Number.isInteger(addedQuantity) || addedQuantity < 1 || !Number.isInteger(alertThreshold) || alertThreshold < 0) {
      setError('Choose a medicine and enter valid whole-number quantities.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const response = await addInventoryStock({
        medicineId: medicine.id,
        name: medicine.name,
        unit: medicine.unit,
        quantity: addedQuantity,
        lowStockAt: alertThreshold,
      })
      applyRetailerResponse(response)
      setMedicineId('')
      setCustomName('')
      setCustomUnit('pack')
      setQuantity('')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function adjustStock(id, delta) {
    const item = inventory.find((entry) => entry.id === id)
    if (!item) return
    setError('')
    try {
      const response = await updateInventoryStock(id, Math.max(0, item.stock + delta))
      applyRetailerResponse(response)
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  async function removeMedicine(id) {
    setError('')
    try {
      const response = await deleteInventoryItem(id)
      applyRetailerResponse(response)
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-soft sm:px-6">Loading retailer inventory…</div>
  }

  if (!retailer) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-xl font-semibold">Could not load retailer inventory</h1>
        <p className="mt-2 text-sm text-alert-text">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-9">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-teal-100 pb-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-600">Retailer workspace</p>
          <h1 className="text-2xl font-semibold text-ink">{retailer.shopName}</h1>
          <p className="mt-1 text-sm text-slate-soft">{retailer.address} · {retailer.phone}</p>
        </div>
        <button type="button" onClick={setShopLocation} disabled={locating} className="flex items-center gap-2 border border-teal-100 bg-white px-3 py-2 text-xs font-medium text-teal-600 hover:bg-teal-50 disabled:opacity-60">
          <MapPin className="h-4 w-4" />{locating ? 'Saving location…' : retailer.location ? 'Refresh shop location' : 'Set shop location'}
        </button>
      </header>

      <section aria-label="Inventory summary" className="mb-7 grid grid-cols-2 border-y border-teal-100 bg-white sm:grid-cols-3">
        <div className="border-r border-teal-100 p-4 sm:p-5">
          <p className="text-xs text-slate-soft">Medicine types</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{inventory.length}</p>
        </div>
        <div className="border-r border-teal-100 p-4 sm:p-5">
          <p className="text-xs text-slate-soft">Units in stock</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalUnits}</p>
        </div>
        <div className="col-span-2 flex items-center gap-2 p-4 sm:col-span-1 sm:p-5">
          <AlertTriangle className={`h-4 w-4 ${lowStockCount ? 'text-amber-700' : 'text-teal-500'}`} />
          <div>
            <p className="text-xs text-slate-soft">Low stock</p>
            <p className="text-lg font-semibold tabular-nums">{lowStockCount}</p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Current medicine stock">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Current stock</h2>
            <label className="relative block w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-soft" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter inventory" className="w-full border border-teal-100 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-400" />
            </label>
          </div>
          {visibleInventory.length ? (
            <div className="divide-y divide-teal-100 border-y border-teal-100 bg-white">
              {visibleInventory.map((item) => (
                <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-4 sm:px-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">{item.name}</h3>
                    <p className={`mt-1 text-xs ${item.stock <= item.lowStockAt ? 'font-medium text-amber-700' : 'text-slate-soft'}`}>
                      {item.stock <= item.lowStockAt ? 'Low stock' : 'In stock'} · Alert at {formatUnits(item.lowStockAt, item.unit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => adjustStock(item.id, -1)} disabled={item.stock === 0} className="grid h-8 w-8 place-items-center border border-teal-100 text-teal-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-16 text-center text-sm tabular-nums">{formatUnits(item.stock, item.unit)}</span>
                    <button type="button" aria-label={`Add one ${item.name}`} onClick={() => adjustStock(item.id, 1)} className="grid h-8 w-8 place-items-center border border-teal-100 text-teal-600 hover:bg-teal-50">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label={`Delete ${item.name}`} onClick={() => removeMedicine(item.id)} className="ml-1 grid h-8 w-8 place-items-center text-slate-soft hover:bg-alert-bg hover:text-alert-text">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-y border-teal-100 py-10 text-center">
              <Boxes className="mx-auto mb-3 h-6 w-6 text-teal-400" />
              <p className="text-sm font-medium">{query ? 'No medicines match your filter' : 'Your inventory is empty'}</p>
              <p className="mt-1 text-xs text-slate-soft">Add your stock to make it visible to medicine seekers.</p>
            </div>
          )}
        </section>

        <aside className="border border-teal-100 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-teal-500" />
            <h2 className="text-base font-semibold">Add medicine stock</h2>
          </div>
          <form onSubmit={addMedicine} className="space-y-4">
            <div>
              <label htmlFor="inventory-medicine" className="mb-1 block text-xs font-medium text-slate-soft">Medicine</label>
              <select id="inventory-medicine" value={medicineId} onChange={(event) => setMedicineId(event.target.value)} className="w-full border border-teal-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400">
                <option value="">Choose a medicine</option>
                {MEDICINES.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>{medicine.name}</option>
                ))}
                <option value="custom">Other medicine</option>
              </select>
            </div>
            {medicineId === 'custom' && (
              <>
                <div>
                  <label htmlFor="custom-medicine-name" className="mb-1 block text-xs font-medium text-slate-soft">Medicine name</label>
                  <input id="custom-medicine-name" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Name and strength" className="w-full border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label htmlFor="custom-medicine-unit" className="mb-1 block text-xs font-medium text-slate-soft">Stock unit</label>
                  <input id="custom-medicine-unit" value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} placeholder="pack, bottle, tablet" className="w-full border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
                </div>
              </>
            )}
            <div>
              <label htmlFor="inventory-quantity" className="mb-1 block text-xs font-medium text-slate-soft">Quantity to add</label>
              <input id="inventory-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="e.g. 12" className="w-full border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
            </div>
            <div>
              <label htmlFor="inventory-alert" className="mb-1 block text-xs font-medium text-slate-soft">Low-stock alert at</label>
              <input id="inventory-alert" type="number" min="0" step="1" value={lowStockAt} onChange={(event) => setLowStockAt(event.target.value)} className="w-full border border-teal-100 px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
            </div>
            {error && <p role="alert" className="text-xs text-alert-text">{error}</p>}
            <button type="submit" disabled={saving} className="w-full bg-teal-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : 'Add to inventory'}</button>
          </form>
          <p className="mt-3 text-xs leading-5 text-slate-soft">Stock is stored in your retailer account and listed in Medicine Finder. Set your shop location to appear in distance order.</p>
        </aside>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-alert-text">{error}</p>}
    </div>
  )
}