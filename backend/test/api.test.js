import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../src/app.js'

let server
let baseUrl

before(async () => {
  server = createApp().listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('health endpoint reports API and database status', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', database: 'disconnected' })
})

test('retailer inventory requires an authenticated retailer', async () => {
  const response = await fetch(`${baseUrl}/api/retailers/me`)
  assert.equal(response.status, 401)
  assert.equal((await response.json()).message, 'Sign in to continue.')
})

test('registration validates input before accessing MongoDB', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'short', role: 'retailer' }),
  })
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /Invalid email/)
})

test('medicine search rejects an empty cart before accessing MongoDB', async () => {
  const response = await fetch(`${baseUrl}/api/medicine-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicines: [] }),
  })
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /at least 1 element/)
})