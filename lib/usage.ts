import { Plan } from '@prisma/client'
import { prisma } from './db'

export const PLAN_LIMITS = {
  FREE: { resumeUploads: 1, jobSearches: 5, coverLetters: 3, tailoredResumes: 3 },
  PRO: {
    resumeUploads: Infinity,
    jobSearches: Infinity,
    coverLetters: Infinity,
    tailoredResumes: Infinity,
  },
} as const

export type Resource = keyof typeof PLAN_LIMITS.FREE

export type LimitCheck = {
  allowed: boolean
  used: number
  limit: number
  plan: Plan
}

function isNewMonth(resetAt: Date, now: Date): boolean {
  return (
    resetAt.getUTCFullYear() < now.getUTCFullYear() ||
    (resetAt.getUTCFullYear() === now.getUTCFullYear() &&
      resetAt.getUTCMonth() < now.getUTCMonth())
  )
}

async function getOrCreateCounter(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { usageCounter: true },
  })
  if (!user) throw new Error(`User ${userId} not found`)

  let counter = user.usageCounter
  if (!counter) {
    counter = await prisma.usageCounter.create({ data: { userId } })
  } else if (isNewMonth(counter.resetAt, new Date())) {
    counter = await prisma.usageCounter.update({
      where: { userId },
      data: {
        resumeUploads: 0,
        jobSearches: 0,
        coverLetters: 0,
        tailoredResumes: 0,
        resetAt: new Date(),
      },
    })
  }

  return { user, counter }
}

export async function checkLimit(
  userId: string,
  resource: Resource,
): Promise<LimitCheck> {
  const { user, counter } = await getOrCreateCounter(userId)
  const limit = PLAN_LIMITS[user.plan][resource]
  const used = counter[resource]
  return { allowed: used < limit, used, limit, plan: user.plan }
}

export async function incrementUsage(userId: string, resource: Resource): Promise<void> {
  await getOrCreateCounter(userId)
  await prisma.usageCounter.update({
    where: { userId },
    data: { [resource]: { increment: 1 } },
  })
}

export async function getUsageSnapshot(userId: string) {
  const { user, counter } = await getOrCreateCounter(userId)
  return {
    plan: user.plan,
    limits: PLAN_LIMITS[user.plan],
    usage: {
      resumeUploads: counter.resumeUploads,
      jobSearches: counter.jobSearches,
      coverLetters: counter.coverLetters,
      tailoredResumes: counter.tailoredResumes,
    },
    resetAt: counter.resetAt,
  }
}
