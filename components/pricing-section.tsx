import Link from 'next/link'
import { Check, X } from 'lucide-react'

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-ja-border px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Pricing</h2>
          <p className="mt-3 text-ja-text2">
            Choose the plan that fits your job search.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-ja-border bg-ja-bg3 p-8">
            <h3 className="text-lg font-medium">Free</h3>
            <div className="mt-4 text-4xl font-bold">
              $0
              <span className="text-base font-normal text-ja-text2">/month</span>
            </div>
            <ul className="mt-8 space-y-3 text-sm">
              <Row check>1 resume upload</Row>
              <Row check>5 job searches / month</Row>
              <Row check>3 cover letters / month</Row>
              <Row check>3 tailored resumes / month</Row>
              <Row>Unlimited access</Row>
            </ul>
            <Link
              href="/sign-up"
              className="mt-8 block w-full rounded-md border border-ja-border bg-ja-bg2 py-3 text-center font-medium hover:bg-ja-bg"
            >
              Get Started →
            </Link>
          </div>

          <div className="rounded-lg border-2 border-ja-accent bg-ja-bg3 p-8 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Pro</h3>
              <span className="rounded-full bg-ja-accent px-3 py-1 text-xs font-medium text-white">
                Best value
              </span>
            </div>
            <div className="mt-4 text-4xl font-bold">
              $19
              <span className="text-base font-normal text-ja-text2">/month</span>
            </div>
            <ul className="mt-8 space-y-3 text-sm">
              <Row check>Unlimited resume uploads</Row>
              <Row check>Unlimited job searches</Row>
              <Row check>Unlimited content generation</Row>
              <Row check>Full AI pipeline access</Row>
              <Row check>Priority support</Row>
            </ul>
            <Link
              href="/sign-up"
              className="mt-8 block w-full rounded-md bg-ja-accent py-3 text-center font-medium text-white hover:bg-ja-accent-hover"
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ children, check }: { children: React.ReactNode; check?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      {check ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-ja-green" />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-ja-text3" />
      )}
      <span className={check ? '' : 'text-ja-text3'}>{children}</span>
    </li>
  )
}
