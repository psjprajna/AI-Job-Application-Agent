import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { checkLimit, incrementUsage } from '@/lib/usage'

const Body = z.object({ applicationId: z.string() })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const application = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId },
  })
  if (!application) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Cache hit — do not count toward limit
  if (application.coverLetter) {
    return NextResponse.json({ coverLetter: application.coverLetter, cached: true })
  }

  const limit = await checkLimit(userId, 'coverLetters')
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'LIMIT_REACHED',
        resource: 'coverLetters',
        used: limit.used,
        limit: limit.limit,
        plan: limit.plan,
      },
      { status: 403 },
    )
  }

  // TODO: generate via Content Generator agent
  const coverLetter = `[stub cover letter for ${application.jobTitle} @ ${application.company}]`
  await prisma.jobApplication.update({
    where: { id: application.id },
    data: { coverLetter },
  })
  await incrementUsage(userId, 'coverLetters')
  return NextResponse.json({ coverLetter, cached: false })
}
