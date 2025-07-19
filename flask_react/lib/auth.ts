import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import Database from 'better-sqlite3'

const dbPath = process.env.AUTH_DATABASE_PATH ?? './auth.db'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: new Database(dbPath),
  plugins: [nextCookies()],
  emailAndPassword: { enabled: true },
})
