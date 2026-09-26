const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const DISEASE_API_BASE_URL = (import.meta.env.VITE_DISEASE_API_URL || 'http://localhost:8001').replace(/\/$/, '')
const REST_API_BASE_URL = (import.meta.env.VITE_REST_API_URL || 'http://localhost:3000').replace(/\/$/, '')

async function requestApi(path, options, fallbackMessage, baseUrl = API_BASE_URL) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, options)
  } catch {
    if (baseUrl === REST_API_BASE_URL) {
      throw new Error(`Cannot reach the retailer API at ${REST_API_BASE_URL}. Start the Express backend and check its MongoDB connection.`)
    }
    throw new Error('Unable to connect to In-Hand Health Care. Check that the API is running.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail = Array.isArray(payload?.detail)
      ? payload.detail.map((item) => item.msg).join(', ')
      : payload?.detail || payload?.message
    throw new Error(typeof detail === 'string' ? detail : fallbackMessage)
  }

  return payload
}

function requestRestApi(path, options = {}, fallbackMessage = 'The In-Hand Health Care API returned an unexpected response.') {
  const token = localStorage.getItem('sd_auth')
  return requestApi(
    path,
    {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    },
    fallbackMessage,
    REST_API_BASE_URL,
  )
}

function postJson(path, data, fallbackMessage) {
  return requestRestApi(path, { method: 'POST', body: JSON.stringify(data) }, fallbackMessage)
}

export function registerAccount(account) {
  return postJson('/api/auth/register', account, 'Could not register this account.')
}

export function loginAccount(credentials) {
  return postJson('/api/auth/login', credentials, 'Could not sign in.')
}

export function getRetailerProfile() {
  return requestRestApi('/api/retailers/me', {}, 'Could not load retailer inventory.')
}

export function updateRetailerLocation(location) {
  return requestRestApi('/api/retailers/me/location', {
    method: 'PATCH',
    body: JSON.stringify(location),
  }, 'Could not save shop location.')
}

export function addInventoryStock(item) {
  return postJson('/api/retailers/me/inventory', item, 'Could not add stock.')
}

export function updateInventoryStock(medicineId, stock) {
  return requestRestApi(`/api/retailers/me/inventory/${encodeURIComponent(medicineId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ stock }),
  }, 'Could not update stock.')
}

export function deleteInventoryItem(medicineId) {
  return requestRestApi(`/api/retailers/me/inventory/${encodeURIComponent(medicineId)}`, {
    method: 'DELETE',
  }, 'Could not remove this medicine.')
}

export function getMedicineOptions(query) {
  const params = new URLSearchParams({ query })
  return requestRestApi(`/api/medicines?${params}`, {}, 'Could not search medicines.')
}

export function searchMedicineShops(medicines, location) {
  return postJson('/api/medicine-search', { medicines, ...(location ? { location } : {}) }, 'Could not search retailer inventory.')
}

export function sendChatMessage(message, history) {
  return requestApi(
    '/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    },
    'The chat service returned an unexpected response.',
  )
}

export function recognizeDisease(image, audio) {
  const formData = new FormData()
  formData.append('image', image)
  if (audio) formData.append('audio', audio)

  return requestApi(
    '/disease-recognizer',
    { method: 'POST', body: formData },
    'The image analysis service returned an unexpected response.',
    DISEASE_API_BASE_URL,
  )
}
