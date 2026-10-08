import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
    }
    return NextResponse.json(session)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'session failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
