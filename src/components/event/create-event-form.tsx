'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createEvent } from '@/lib/actions/create-event'

interface CreateEventFormProps {
  groupId: string
}

export function CreateEventForm({ groupId }: CreateEventFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Default: today, 19:00–21:00
  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createEvent(groupId, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">ชื่อกิจกรรม *</Label>
        <Input id="title" name="title" placeholder="เช่น แบดมินตันวันศุกร์" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">วันที่ *</Label>
        <Input id="date" name="date" type="date" defaultValue={today} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="timeStart">เวลาเริ่ม *</Label>
          <Input id="timeStart" name="timeStart" type="time" defaultValue="19:00" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timeEnd">เวลาจบ *</Label>
          <Input id="timeEnd" name="timeEnd" type="time" defaultValue="21:00" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">สถานที่</Label>
        <Input id="location" name="location" placeholder="เช่น สนาม ABC Sport Complex" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="maxPlayers">จำนวนผู้เล่นสูงสุด *</Label>
          <Input id="maxPlayers" name="maxPlayers" type="number" min={2} max={100} defaultValue={8} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="numCourts">จำนวนคอร์ท *</Label>
          <Input id="numCourts" name="numCourts" type="number" min={1} max={20} defaultValue={2} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="estimatedCost">ค่าใช้จ่ายประมาณการ (บาท)</Label>
        <Input id="estimatedCost" name="estimatedCost" type="number" min={0} placeholder="เช่น 1200" />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'กำลังสร้าง…' : 'เผยแพร่กิจกรรม'}
      </Button>
    </form>
  )
}
