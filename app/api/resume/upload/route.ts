import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkLimit, incrementUsage } from '@/lib/usage'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

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

  // TODO: parse resume (Resume Parser agent)
  await incrementUsage(userId, 'resumeUploads')
  return NextResponse.json({ status: 'stub', message: 'resume parser not yet wired' })
}
