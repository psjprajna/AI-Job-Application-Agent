'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { Button } from './ui/button'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  resource: string
  used: number
  limit: number
}

export function UpgradeModal({ open, onClose, resource, used, limit }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  async function upgrade() {
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
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-ja-bg3 p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold">
            You&apos;ve hit your Free limit
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-ja-text2">
            You&apos;ve used {used}/{limit} {resource} this month. Upgrade to Pro for
            unlimited access.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Maybe later
            </Button>
            <Button onClick={upgrade} disabled={loading}>
              {loading ? 'Loading…' : 'Upgrade to Pro →'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
