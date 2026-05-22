import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { checkLimit, incrementUsage } from '@/lib/usage'
import { generateContent } from '@/lib/agents/content-generator'
import type { Job, ParsedResume } from '@/lib/agents/types'

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
    include: { resume: true },
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
  if (!application.resume?.parsed) {
    return NextResponse.json({ error: 'no_parsed_resume' }, { status: 400 })
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

  const resume = JSON.parse(application.resume.parsed) as ParsedResume
  const job: Job = {
    id: application.id,
    source: 'application',
    title: application.jobTitle,
    company: application.company,
    location: null,
    url: application.jobUrl ?? '',
    description: application.jobDescription ?? '',
    publishedAt: null,
    tags: [],
  }
  const { tailoredBullets } = await generateContent(resume, job)
  const tailoredResume = tailoredBullets.map((b) => `- ${b}`).join('\n')

  await prisma.jobApplication.update({
    where: { id: application.id },
    data: { tailoredResume },
  })
  await incrementUsage(userId, 'tailoredResumes')

  return NextResponse.json({ tailoredResume, bullets: tailoredBullets, cached: false })
}
