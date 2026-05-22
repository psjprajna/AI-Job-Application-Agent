import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const priceId = process.env.STRIPE_PRO_PRICE_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  if (!priceId) {
    return NextResponse.json(
      { error: 'STRIPE_PRO_PRICE_ID is not configured' },
      { status: 500 },
    )
  }

  let user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'email_required' }, { status: 400 })
    }
    user = await prisma.user.create({
      data: { id: userId, email, name: clerkUser?.firstName ?? null },
    })
  }

  const customerId = await getOrCreateStripeCustomer(userId)

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: { userId },
  })

  return NextResponse.json({ url: session.url })
}
