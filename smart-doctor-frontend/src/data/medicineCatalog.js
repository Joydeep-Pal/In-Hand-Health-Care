export const MEDICINES = [
  { id: 'paracetamol', name: 'Paracetamol 500mg', unit: 'strip' },
  { id: 'cetirizine', name: 'Cetirizine 10mg', unit: 'strip' },
  { id: 'ors', name: 'ORS', unit: 'sachet' },
  { id: 'azithromycin', name: 'Azithromycin 500mg', unit: 'strip' },
  { id: 'omeprazole', name: 'Omeprazole 20mg', unit: 'strip' },
  { id: 'vitamin-c', name: 'Vitamin C 500mg', unit: 'strip' },
  { id: 'ibuprofen', name: 'Ibuprofen 400mg', unit: 'strip' },
  { id: 'antacid', name: 'Antacid tablets', unit: 'strip' },
]

export function pluralizeUnit(unit) {
  return unit === 'box' ? 'boxes' : `${unit}s`
}

export function formatUnits(quantity, unit) {
  return `${quantity} ${quantity === 1 ? unit : pluralizeUnit(unit)}`
}