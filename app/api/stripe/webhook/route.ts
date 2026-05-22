import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 500 },
    )
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'no_signature' }, { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : null
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: 'PRO', stripeSubscriptionId: subscriptionId },
        })
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : null
      if (!customerId) break
      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
      if (!user) break
      const plan = sub.status === 'active' || sub.status === 'trialing' ? 'PRO' : 'FREE'
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan,
          stripeSubscriptionId: sub.id,
          planExpiresAt: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null,
        },
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : null
      if (!customerId) break
      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
      if (!user) break
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'FREE', stripeSubscriptionId: null, planExpiresAt: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
