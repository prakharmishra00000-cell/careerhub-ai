import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') ?? 'recent' // recent | helpful | high | low
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '10'), 50)

    const orderBy: any = sort === 'helpful' ? { helpful: 'desc' as const }
      : sort === 'high' ? { rating: 'desc' as const }
      : sort === 'low' ? { rating: 'asc' as const }
      : { createdAt: 'desc' as const }

    const [reviews, total] = await Promise.all([
      db.companyReview.findMany({
        where: { companyId: id },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.companyReview.count({ where: { companyId: id } }),
    ])

    // Compute rating distribution
    const allRatings = await db.companyReview.findMany({
      where: { companyId: id },
      select: { rating: true },
    })
    const avgRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: allRatings.filter((r) => r.rating === star).length,
    }))

    return NextResponse.json({
      reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: allRatings.length,
      distribution,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await req.json()

    // Validate
    const { rating, title, pros, cons, jobTitle, employmentStatus, workDuration, userRole, isAnonymous } = body
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    if (!title || !title.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    // Verify company exists
    const company = await db.company.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const review = await db.companyReview.create({
      data: {
        companyId: id,
        userId: session?.id ?? null,
        userName: isAnonymous ? 'Anonymous' : (session?.name ?? 'Anonymous'),
        userRole: userRole ?? 'candidate',
        rating: parseInt(rating),
        title: title.trim().slice(0, 200),
        pros: pros?.trim() || null,
        cons: cons?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        employmentStatus: employmentStatus ?? null,
        workDuration: workDuration?.trim() || null,
        isAnonymous: !!isAnonymous,
      },
    })

    return NextResponse.json({ review })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { reviewId, action } = body // action: 'helpful'
    if (action === 'helpful' && reviewId) {
      await db.companyReview.update({
        where: { id: reviewId },
        data: { helpful: { increment: 1 } },
      })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
