import { MEDICINES } from './medicineCatalog.js'

const anchor = { latitude: 22.960297, longitude: 88.448256 }
const medicineById = new Map(MEDICINES.map((medicine) => [medicine.id, medicine]))

function stock(medicineId, quantity) {
  const medicine = medicineById.get(medicineId)
  if (!medicine) throw new Error(`Unknown demo medicine: ${medicineId}`)
  return {
    medicineId: medicine.id,
    name: medicine.name,
    unit: medicine.unit,
    stock: quantity,
    lowStockAt: 5,
  }
}

export const DEMO_RETAILERS = [
  {
    email: 'demo.pharmacy.01@example.test',
    shopName: 'Sample Care Pharmacy',
    phone: '+91-00000-00001',
    address: 'Sample Market Road, Demo Ward 1',
    location: { ...anchor },
    inventory: [stock('paracetamol', 42), stock('cetirizine', 24), stock('ors', 32)],
  },
  {
    email: 'demo.pharmacy.02@example.test',
    shopName: 'Green Cross Demo Medicos',
    phone: '+91-00000-00002',
    address: 'North Sample Lane, Demo Ward 2',
    location: { latitude: 22.96105, longitude: 88.44762 },
    inventory: [stock('azithromycin', 16), stock('omeprazole', 28), stock('vitamin-c', 35)],
  },
  {
    email: 'demo.pharmacy.03@example.test',
    shopName: 'Wellness Corner Pharmacy',
    phone: '+91-00000-00003',
    address: 'East Sample Crossing, Demo Ward 3',
    location: { latitude: 22.95921, longitude: 88.44904 },
    inventory: [stock('ibuprofen', 19), stock('antacid', 27), stock('paracetamol', 31)],
  },
  {
    email: 'demo.pharmacy.04@example.test',
    shopName: 'Neighborhood Health Store',
    phone: '+91-00000-00004',
    address: 'South Sample Street, Demo Ward 4',
    location: { latitude: 22.96146, longitude: 88.44918 },
    inventory: [stock('cetirizine', 22), stock('ors', 18), stock('omeprazole', 14)],
  },
  {
    email: 'demo.pharmacy.05@example.test',
    shopName: 'Everyday Medicines Demo Shop',
    phone: '+91-00000-00005',
    address: 'West Sample Avenue, Demo Ward 5',
    location: { latitude: 22.95962, longitude: 88.4467 },
    inventory: [stock('vitamin-c', 26), stock('azithromycin', 12), stock('ibuprofen', 21)],
  },
]