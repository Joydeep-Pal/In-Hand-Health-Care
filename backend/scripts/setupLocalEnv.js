import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const envPath = fileURLToPath(new URL('../.env', import.meta.url))
const examplePath = fileURLToPath(new URL('../.env.example', import.meta.url))

if (!existsSync(envPath)) copyFileSync(examplePath, envPath)

const contents = readFileSync(envPath, 'utf8')
const currentSecret = contents.match(/^JWT_SECRET=(.*)$/m)?.[1]?.trim()
if (currentSecret && currentSecret.length >= 32 && !currentSecret.includes('replace-this')) {
  console.log('Local JWT secret is already configured.')
  process.exit(0)
}

const newSecret = randomBytes(48).toString('base64url')
const updatedContents = /^JWT_SECRET=.*$/m.test(contents)
  ? contents.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${newSecret}`)
  : `${contents.trimEnd()}\nJWT_SECRET=${newSecret}\n`
writeFileSync(envPath, updatedContents, 'utf8')
console.log('Generated a strong JWT secret in backend/.env. The secret was not printed.')