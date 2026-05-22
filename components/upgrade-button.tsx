'use client'

import { useState } from 'react'
import { Button } from './ui/button'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function go() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={go} disabled={loading}>
      {loading ? 'Loading…' : 'Upgrade to Pro'}
    </Button>
  )
}
