import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, setSessionCookie } from '@/lib/auth'
import type { SessionUser, Role } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
    }
    if (user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
    }

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const session: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      avatarUrl: user.avatarUrl,
    }
    await setSessionCookie(session)

    return NextResponse.json(session)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'login failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
