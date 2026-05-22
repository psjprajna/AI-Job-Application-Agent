import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import type { ParsedResume } from '@/lib/agents/types'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const application = await prisma.jobApplication.findFirst({
    where: { userId, coverLetter: { not: null } },
    orderBy: { updatedAt: 'desc' },
    include: { resume: true },
  })

  if (!application) {
    return NextResponse.json({ error: 'no_application' }, { status: 404 })
  }

  const parsedResume = application.resume?.parsed
    ? (JSON.parse(application.resume.parsed) as ParsedResume)
    : null

  return NextResponse.json({
    application: {
      id: application.id,
      jobTitle: application.jobTitle,
      company: application.company,
      coverLetter: application.coverLetter,
      tailoredResume: application.tailoredResume,
    },
    resume: parsedResume,
  })
}
