import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkLimit, incrementUsage } from '@/lib/usage'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

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

  // TODO: search jobs across providers (Job Search agent)
  await incrementUsage(userId, 'jobSearches')
  return NextResponse.json({ status: 'stub', results: [] })
}
