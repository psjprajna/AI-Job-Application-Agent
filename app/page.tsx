import Link from 'next/link'
import { PricingSection } from '@/components/pricing-section'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ja-bg text-ja-text">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="text-lg font-semibold">AI Job Agent</div>
        <div className="flex items-center gap-4 text-sm text-ja-text2">
          <Link href="/sign-in" className="hover:text-ja-text">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-ja-accent px-4 py-2 text-white hover:bg-ja-accent-hover"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center md:pt-28">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Apply to jobs in your sleep.
        </h1>
        <p className="mt-6 text-lg text-ja-text2 md:text-xl">
          A 5-agent pipeline that finds roles, ranks them against your resume, and
          drafts tailored applications — so you spend time interviewing, not
          formatting.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-md bg-ja-accent px-6 py-3 font-medium text-white hover:bg-ja-accent-hover"
          >
            Get started free
          </Link>
          <Link
            href="#pricing"
            className="rounded-md border border-ja-border px-6 py-3 font-medium text-ja-text hover:bg-ja-bg2"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section id="how" className="border-t border-ja-border bg-ja-bg2 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-5">
            {[
              { n: '1', t: 'Resume Parser', d: 'Extracts skills + experience.' },
              { n: '2', t: 'Job Search', d: 'Finds matching roles across boards.' },
              { n: '3', t: 'Match & Rank', d: 'Scores fit with embeddings.' },
              { n: '4', t: 'Content Generator', d: 'Drafts cover letters + resumes.' },
              { n: '5', t: 'Apply', d: 'Auto-fills via browser extension.' },
            ].map((s) => (
              <div key={s.n} className="rounded-lg bg-ja-bg3 p-5 text-center">
                <div className="text-2xl font-bold text-ja-accent">{s.n}</div>
                <div className="mt-2 font-medium">{s.t}</div>
                <div className="mt-1 text-sm text-ja-text2">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="border-t border-ja-border px-6 py-24 text-center">
        <h2 className="text-3xl font-bold">Stop tweaking, start interviewing.</h2>
        <p className="mt-4 text-ja-text2">
          Free forever for casual searches. Upgrade when you mean it.
        </p>
        <Link
          href="/sign-up"
          className="mt-8 inline-block rounded-md bg-ja-accent px-8 py-3 font-medium text-white hover:bg-ja-accent-hover"
        >
          Get started free
        </Link>
      </section>

      <footer className="border-t border-ja-border px-6 py-8 text-center text-sm text-ja-text3">
        MIT licensed · Built with Next.js, Prisma, Clerk, and Stripe.
      </footer>
    </main>
  )
}
