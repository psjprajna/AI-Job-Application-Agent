'use client'

import { useState } from 'react'
import { Button } from './ui/button'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function go() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" onClick={go} disabled={loading}>
      {loading ? 'Loading…' : 'Manage billing'}
    </Button>
  )
}
