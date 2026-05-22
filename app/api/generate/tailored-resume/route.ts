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

  if (application.tailoredResume) {
    return NextResponse.json({
      tailoredResume: application.tailoredResume,
      cached: true,
    })
  }

  const limit = await checkLimit(userId, 'tailoredResumes')
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'LIMIT_REACHED',
        resource: 'tailoredResumes',
        used: limit.used,
        limit: limit.limit,
        plan: limit.plan,
      },
      { status: 403 },
    )
  }

  // TODO: tailor via Content Generator agent
  const tailoredResume = `[stub tailored resume for ${application.jobTitle} @ ${application.company}]`
  await prisma.jobApplication.update({
    where: { id: application.id },
    data: { tailoredResume },
  })
  await incrementUsage(userId, 'tailoredResumes')
  return NextResponse.json({ tailoredResume, cached: false })
}
