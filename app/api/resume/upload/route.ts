import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { checkLimit, incrementUsage } from '@/lib/usage'
import { parseResume } from '@/lib/agents/resume-parser'

const Body = z.object({ rawText: z.string().min(40) })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsedBody = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const limit = await checkLimit(userId, 'resumeUploads')
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'LIMIT_REACHED',
        resource: 'resumeUploads',
        used: limit.used,
        limit: limit.limit,
        plan: limit.plan,
      },
      { status: 403 },
    )
  }

  const { parsed, mode } = await parseResume(parsedBody.data.rawText)

  const resume = await prisma.resume.create({
    data: {
      userId,
      rawText: parsedBody.data.rawText,
      parsed: JSON.stringify(parsed),
    },
  })

  await incrementUsage(userId, 'resumeUploads')

  return NextResponse.json({ id: resume.id, parsed, mode })
}
