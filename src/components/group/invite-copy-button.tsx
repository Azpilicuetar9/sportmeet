'use client'

import { useState } from 'react'

export function InviteCopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/join/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 rounded-lg border bg-muted px-3 py-2 text-xs text-muted-foreground truncate font-mono">
        /join/{token}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
      >
        {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
      </button>
    </div>
  )
}
