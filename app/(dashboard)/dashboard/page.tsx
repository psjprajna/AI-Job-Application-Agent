import Link from 'next/link'
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    return <div className="p-8">Not signed in.</div>
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Welcome{user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="mt-2 text-ja-text2">
        Upload a resume, search for roles, generate tailored content, and apply.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-ja-border bg-ja-bg3 p-6">
          <h2 className="font-medium">Resume</h2>
          <p className="mt-2 text-sm text-ja-text2">No resume uploaded yet.</p>
        </div>
        <div className="rounded-lg border border-ja-border bg-ja-bg3 p-6">
          <h2 className="font-medium">Searches</h2>
          <p className="mt-2 text-sm text-ja-text2">Run your first job search.</p>
        </div>
        <div className="rounded-lg border border-ja-border bg-ja-bg3 p-6">
          <h2 className="font-medium">Applications</h2>
          <p className="mt-2 text-sm text-ja-text2">Nothing in flight yet.</p>
        </div>
      </div>

      <div className="mt-10">
        <Link
          href="/dashboard/billing"
          className="text-sm text-ja-accent hover:underline"
        >
          Manage billing →
        </Link>
      </div>
    </main>
  )
}
