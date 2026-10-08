import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ searches: [] })
    const searches = await db.searchHistory.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return NextResponse.json({ searches })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { query, filters, resultsCount } = body
    if (!query || !query.trim()) return NextResponse.json({ ok: false })

    const record = await db.searchHistory.create({
      data: {
        userId: session?.id ?? null,
        query: query.trim().slice(0, 200),
        filters: filters ? JSON.stringify(filters) : null,
        resultsCount: resultsCount ?? 0,
      },
    })
    return NextResponse.json({ ok: true, id: record.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ ok: false })
    await db.searchHistory.deleteMany({ where: { userId: session.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
