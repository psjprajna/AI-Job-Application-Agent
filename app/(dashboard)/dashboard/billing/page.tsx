import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getUsageSnapshot, PLAN_LIMITS, type Resource } from '@/lib/usage'
import { UpgradeButton } from '@/components/upgrade-button'
import { ManageBillingButton } from '@/components/manage-billing-button'

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-4 text-ja-text2">
          Your account isn&apos;t synced to the database yet. Visit the dashboard to
          initialize it.
        </p>
      </main>
    )
  }

  const snapshot = await getUsageSnapshot(userId)
  const isPro = snapshot.plan === 'PRO'
  const resources: { key: Resource; label: string }[] = [
    { key: 'resumeUploads', label: 'Resume uploads' },
    { key: 'jobSearches', label: 'Job searches' },
    { key: 'coverLetters', label: 'Cover letters' },
    { key: 'tailoredResumes', label: 'Tailored resumes' },
  ]

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Billing</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            isPro
              ? 'bg-ja-accent text-white'
              : 'bg-ja-bg2 text-ja-text2 border border-ja-border'
          }`}
        >
          {snapshot.plan}
        </span>
      </div>

      <div className="mt-8 rounded-lg border border-ja-border bg-ja-bg3 p-6">
        <h2 className="font-medium">Usage this month</h2>
        <div className="mt-5 space-y-4">
          {resources.map((r) => {
            const used = snapshot.usage[r.key]
            const limit = PLAN_LIMITS[snapshot.plan][r.key]
            const pct =
              limit === Infinity ? 0 : Math.min(100, (used / limit) * 100)
            return (
              <div key={r.key}>
                <div className="flex justify-between text-sm">
                  <span>{r.label}</span>
                  <span className="text-ja-text2">
                    {used} / {limit === Infinity ? '∞' : limit}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-ja-bg2">
                  <div
                    className="h-full bg-ja-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        {isPro ? <ManageBillingButton /> : <UpgradeButton />}
      </div>
    </main>
  )
}
