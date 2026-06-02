'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { joinEvent, leaveEvent } from '@/lib/actions/events'

interface JoinLeaveButtonProps {
  eventId: string
  currentStatus: 'confirmed' | 'waitlist' | 'left' | null // null = not joined
  isFull: boolean
  eventOpen: boolean
}

export function JoinLeaveButton({ eventId, currentStatus, isFull, eventOpen }: JoinLeaveButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (!eventOpen) return null

  // Already in main list
  if (currentStatus === 'confirmed') {
    return (
      <Button
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={() => startTransition(() => leaveEvent(eventId))}
      >
        {isPending ? 'กำลังดำเนินการ…' : 'ถอนตัวจากกิจกรรม'}
      </Button>
    )
  }

  // In waitlist
  if (currentStatus === 'waitlist') {
    return (
      <Button
        variant="outline"
        className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
        disabled={isPending}
        onClick={() => startTransition(() => leaveEvent(eventId))}
      >
        {isPending ? 'กำลังดำเนินการ…' : 'อยู่ในรายชื่อสำรอง — กดเพื่อถอน'}
      </Button>
    )
  }

  // Not joined — show join (or join waitlist if full)
  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(() => joinEvent(eventId))}
    >
      {isPending
        ? 'กำลังดำเนินการ…'
        : isFull
          ? 'เข้าร่วมรายชื่อสำรอง'
          : 'เข้าร่วมกิจกรรม'}
    </Button>
  )
}
