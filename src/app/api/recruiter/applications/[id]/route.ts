import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const ALLOWED_STATUSES = ['saved', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['recruiter', 'company_admin', 'admin'])
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { status, notes, interviewDate } = body

    // Find the application with its job to verify ownership
    const application = await db.application.findUnique({
      where: { id },
      include: { job: { select: { id: true, postedById: true, title: true } } },
    })
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // Verify the recruiter owns the job (or is admin)
    if (user.role !== 'admin' && application.job.postedById !== user.id) {
      return NextResponse.json({ error: 'You can only manage applications to your own jobs' }, { status: 403 })
    }

    const updateData: any = {}
    if (status && ALLOWED_STATUSES.includes(status)) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (interviewDate !== undefined) updateData.interviewDate = interviewDate ? new Date(interviewDate) : null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db.application.update({
      where: { id },
      data: updateData,
      include: {
        job: { select: { id: true, title: true, companyName: true, city: true, remoteType: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Create a notification for the candidate
    if (status && status !== application.status) {
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
      await db.notification.create({
        data: {
          userId: application.userId,
          type: 'application_reminder',
          title: `Application status updated`,
          body: `Your application for ${application.job.title} moved to "${statusLabel}"`,
          link: `#applications`,
          read: false,
        },
      })
    }

    return NextResponse.json({ application: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['recruiter', 'company_admin', 'admin'])
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const application = await db.application.findUnique({
      where: { id },
      include: {
        job: { select: { id: true, title: true, companyName: true, city: true, remoteType: true, postedById: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (user.role !== 'admin' && application.job.postedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ application })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
