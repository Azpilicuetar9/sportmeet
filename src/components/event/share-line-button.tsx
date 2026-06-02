'use client'

import { Button } from '@/components/ui/button'

interface ShareLineButtonProps {
  eventId: string
  type?: 'roster' | 'expense'
}

export function ShareLineButton({ eventId, type = 'roster' }: ShareLineButtonProps) {
  function handleShare() {
    const imageUrl = `${window.location.origin}/api/og?eventId=${eventId}&type=${type}`
    // Use Web Share API (supported on mobile)
    if (navigator.share) {
      navigator.share({ url: imageUrl, title: 'SportMeet & Split' })
    } else {
      // Fallback: open LINE share URL
      const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(imageUrl)}`
      window.open(lineUrl, '_blank')
    }
  }

  return (
    <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
      <span className="text-lg">💬</span>
      แชร์ไป LINE
    </Button>
  )
}
