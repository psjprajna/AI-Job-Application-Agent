import Stripe from 'stripe'
import { prisma } from './db'

let _stripe: Stripe | null = null

export function stripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  _stripe = new Stripe(key)
  return _stripe
}

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error(`User ${userId} not found`)
  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe().customers.create({
    email: user.email,
    metadata: { userId: user.id },
  })
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  })
  return customer.id
}
