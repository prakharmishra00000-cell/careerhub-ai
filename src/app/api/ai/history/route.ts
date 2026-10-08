import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ generations: [] })
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // interview_prep | career_roadmap
    const where: any = { userId: session.id }
    if (type) where.type = type
    const generations = await db.aiGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, type: true, title: true, createdAt: true, input: true },
    })
    return NextResponse.json({ generations })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { type, title, input, result } = body
    if (!type || !title || !result) return NextResponse.json({ error: 'type, title, result required' }, { status: 400 })

    const gen = await db.aiGeneration.create({
      data: {
        userId: session?.id ?? null,
        type,
        title: title.slice(0, 300),
        input: input ? JSON.stringify(input) : null,
        result: typeof result === 'string' ? result : JSON.stringify(result),
      },
    })
    return NextResponse.json({ ok: true, id: gen.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (id) {
      await db.aiGeneration.deleteMany({ where: { id, userId: session.id } })
    } else {
      const type = searchParams.get('type')
      const where: any = { userId: session.id }
      if (type) where.type = type
      await db.aiGeneration.deleteMany({ where })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
