'use client'

import { useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { uploadSlip } from '@/lib/actions/payments'

interface SlipUploadButtonProps {
  eventId: string
  currentStatus: string
}

export function SlipUploadButton({ eventId, currentStatus }: SlipUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  if (currentStatus === 'paid') return null

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      await uploadSlip(eventId, file)
    })
  }

  const label = currentStatus === 'pending_review'
    ? 'อัปโหลดสลิปใหม่'
    : 'อัปโหลดสลิปหลังโอนเงิน'

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        className="w-full gap-2"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        <span className="text-lg">📎</span>
        {isPending ? 'กำลังอัปโหลด…' : label}
      </Button>
    </>
  )
}
