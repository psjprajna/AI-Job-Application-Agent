import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUsageSnapshot } from '@/lib/usage'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const snapshot = await getUsageSnapshot(userId)
    return NextResponse.json(snapshot)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'usage_unavailable'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
