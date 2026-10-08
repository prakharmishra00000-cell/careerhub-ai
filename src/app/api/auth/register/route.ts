import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, setSessionCookie, getSession } from '@/lib/auth'
import type { SessionUser, Role } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const role: Role = body.role === 'recruiter' ? 'recruiter' : 'candidate'

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'email, password and name are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'email already registered' }, { status: 409 })
    }

    const passwordHash = hashPassword(password)
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        lastLoginAt: new Date(),
        ...(role === 'candidate' ? { profile: { create: {} } } : {}),
      },
    })

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
    const msg = e instanceof Error ? e.message : 'register failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  return NextResponse.json({ session })
}
