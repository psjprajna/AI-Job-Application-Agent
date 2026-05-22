import Link from 'next/link'
import { prisma } from '@/lib/db'
import type { ParsedResume } from '@/lib/agents/types'

const DEMO_USER_ID = 'demo-user'

export const dynamic = 'force-dynamic'

export default async function DemoPage() {
  const user = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
    include: {
      resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
      applications: { orderBy: { matchScore: 'desc' }, take: 10 },
    },
  })

  if (!user || user.resumes.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Demo not seeded</h1>
        <p className="mt-4 text-ja-text2">
          Run <code className="rounded bg-ja-bg2 px-2 py-0.5">npm run seed</code> to populate
          a sample resume + generated applications, then refresh.
        </p>
      </main>
    )
  }

  const resume = JSON.parse(user.resumes[0].parsed ?? '{}') as ParsedResume
  const apps = user.applications

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-ja-text2 hover:text-ja-text">
          ← Back to landing
        </Link>
        <span className="rounded-full border border-ja-border bg-ja-bg2 px-3 py-1 text-xs text-ja-text2">
          Local demo · no auth
        </span>
      </nav>

      <h1 className="text-3xl font-bold">Pipeline run for {resume.name ?? 'demo user'}</h1>
      <p className="mt-2 text-ja-text2">
        The 4 server-side agents ran end-to-end. The 5th (Apply) lives in{' '}
        <code className="rounded bg-ja-bg2 px-1.5 py-0.5 text-sm">extension/</code> as a
        Manifest V3 browser extension.
      </p>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <Stat label="Skills extracted" value={String(resume.skills.length)} />
        <Stat label="Experience entries" value={String(resume.experience.length)} />
        <Stat label="Applications generated" value={String(apps.length)} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">1 · Parsed resume</h2>
        <p className="mt-1 text-sm text-ja-text2">
          Raw text → structured profile via{' '}
          <code className="rounded bg-ja-bg2 px-1.5 py-0.5 text-xs">parseResume()</code>.
        </p>
        <div className="mt-4 rounded-lg border border-ja-border bg-ja-bg3 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={resume.name} />
            <Field label="Email" value={resume.email} />
            <Field label="Phone" value={resume.phone} />
            <Field label="Links" value={resume.links.join(', ')} />
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wide text-ja-text3">
              Skills
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {resume.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-ja-border bg-ja-bg2 px-2.5 py-1 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="text-xs font-medium uppercase tracking-wide text-ja-text3">
              Experience
            </div>
            {resume.experience.map((e, i) => (
              <div key={i} className="rounded border border-ja-border bg-ja-bg2 p-3 text-sm">
                <div className="font-medium">
                  {e.title || '(role)'} — {e.company}
                </div>
                <div className="text-xs text-ja-text3">
                  {e.start ?? '?'} – {e.end ?? 'Present'}
                </div>
                {e.bullets.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-ja-text2">
                    {e.bullets.slice(0, 3).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">2–4 · Searched, ranked, and drafted</h2>
        <p className="mt-1 text-sm text-ja-text2">
          Top {apps.length} matches from Remotive, ranked against the resume, with cover
          letters and tailored bullets generated for each.
        </p>
        <div className="mt-4 space-y-4">
          {apps.map((app) => (
            <details
              key={app.id}
              className="group rounded-lg border border-ja-border bg-ja-bg3 p-5"
            >
              <summary className="flex cursor-pointer items-center justify-between">
                <div>
                  <div className="font-medium">
                    {app.jobTitle}{' '}
                    <span className="font-normal text-ja-text2">@ {app.company}</span>
                  </div>
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-ja-accent hover:underline"
                    >
                      {new URL(app.jobUrl).hostname} ↗
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-ja-accent/10 px-2.5 py-1 text-xs font-medium text-ja-accent">
                    match {(app.matchScore ?? 0).toFixed(3)}
                  </span>
                  <span className="text-ja-text3 group-open:rotate-90">→</span>
                </div>
              </summary>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ja-text3">
                    Cover letter
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {app.coverLetter}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ja-text3">
                    Tailored bullets
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6">
                    {app.tailoredResume}
                  </pre>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">5 · Apply</h2>
        <p className="mt-2 text-sm text-ja-text2">
          The browser extension in <code className="rounded bg-ja-bg2 px-1.5 py-0.5 text-xs">extension/</code> reads{' '}
          <code className="rounded bg-ja-bg2 px-1.5 py-0.5 text-xs">/api/applications/latest</code> and autofills detected
          Greenhouse / Lever / Ashby application forms.
        </p>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ja-border bg-ja-bg3 p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ja-text3">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-ja-text3">
        {label}
      </div>
      <div className="mt-1 text-sm">{value || <span className="text-ja-text3">—</span>}</div>
    </div>
  )
}
