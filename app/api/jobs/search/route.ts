import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { checkLimit, incrementUsage } from '@/lib/usage'
import { searchJobs } from '@/lib/agents/job-search'
import { rankJobs } from '@/lib/agents/match-rank'
import type { MatchedJob, ParsedResume } from '@/lib/agents/types'

const Body = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  resumeId: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const limit = await checkLimit(userId, 'jobSearches')
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'LIMIT_REACHED',
        resource: 'jobSearches',
        used: limit.used,
        limit: limit.limit,
        plan: limit.plan,
      },
      { status: 403 },
    )
  }

  const jobs = await searchJobs(parsed.data)

  let ranked: MatchedJob[] = jobs.map((j) => ({ ...j, score: 0, reasons: [] as string[] }))
  let mode: 'llm' | 'heuristic' | 'unranked' = 'unranked'
  if (parsed.data.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: parsed.data.resumeId, userId },
    })
    if (resume?.parsed) {
      const parsedResume = JSON.parse(resume.parsed) as ParsedResume
      const result = await rankJobs(parsedResume, jobs)
      ranked = result.ranked
      mode = result.mode
    }
  }

  await incrementUsage(userId, 'jobSearches')

  return NextResponse.json({ jobs: ranked, mode, count: ranked.length })
}
