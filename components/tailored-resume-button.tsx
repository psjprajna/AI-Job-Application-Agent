'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { UpgradeModal } from './upgrade-modal'

export function TailoredResumeButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false)
  const [limitHit, setLimitHit] = useState<{
    resource: string
    used: number
    limit: number
  } | null>(null)

  async function run() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate/tailored-resume', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      if (res.status === 403) {
        const data = await res.json()
        setLimitHit({ resource: 'tailored resumes', used: data.used, limit: data.limit })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={run} disabled={loading}>
        {loading ? 'Tailoring…' : 'Generate tailored resume'}
      </Button>
      <UpgradeModal
        open={limitHit !== null}
        onClose={() => setLimitHit(null)}
        resource={limitHit?.resource ?? ''}
        used={limitHit?.used ?? 0}
        limit={limitHit?.limit ?? 0}
      />
    </>
  )
}
