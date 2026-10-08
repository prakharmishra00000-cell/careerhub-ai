// CareerHub AI — session/auth helpers (cookie-based, simple)
// NOTE: This is a demo-grade session. Uses signed cookies for the sandbox.

import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { db } from './db'
import type { SessionUser } from './types'

const COOKIE_NAME = 'careerhub_session'
const SALT = 'careerhub_salt_v1'

export function hashPassword(pw: string) {
  return createHash('sha256').update(pw + SALT).digest('hex')
}

export function signSession(payload: SessionUser): string {
  const json = JSON.stringify(payload)
  const b64 = Buffer.from(json, 'utf8').toString('base64url')
  const sig = createHash('sha256').update(b64 + SALT).digest('hex').slice(0, 16)
  return `${b64}.${sig}`
}

export function verifySession(token: string): SessionUser | null {
  try {
    const [b64, sig] = token.split('.')
    if (!b64 || !sig) return null
    const expectedSig = createHash('sha256').update(b64 + SALT).digest('hex').slice(0, 16)
    if (sig !== expectedSig) return null
    const json = Buffer.from(b64, 'base64url').toString('utf8')
    return JSON.parse(json) as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = verifySession(token)
  if (!payload) return null
  return payload
}

export async function setSessionCookie(payload: SessionUser) {
  const store = await cookies()
  store.set(COOKIE_NAME, signSession(payload), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function requireUser(roles?: string[]): Promise<SessionUser | null> {
  const u = await getSession()
  if (!u) return null
  if (roles && !roles.includes(u.role)) return null
  return u
}

export async function getDbUserFromSession(): Promise<{ id: string; email: string; name: string; role: string; avatarUrl: string | null } | null> {
  const s = await getSession()
  if (!s) return null
  const u = await db.user.findUnique({ where: { id: s.id }, select: { id: true, email: true, name: true, role: true, avatarUrl: true } })
  return u
}
