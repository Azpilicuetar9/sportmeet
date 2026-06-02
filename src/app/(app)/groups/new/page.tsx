'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createGroup } from '@/lib/actions/groups'

export default function CreateGroupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createGroup(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <main className="min-h-svh bg-muted/40">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors">← กลับ</Link>
        <span className="font-semibold">สร้างกลุ่ม</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="rounded-xl border bg-card p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center py-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-5xl mx-auto mb-3">🏸</div>
              <p className="text-sm text-muted-foreground">กลุ่มแบดมินตันแบบปิดสำหรับเพื่อนที่รู้จักกัน</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">ชื่อกลุ่ม *</Label>
              <Input id="name" name="name" placeholder="เช่น แบดวันศุกร์, ทีมแบดออฟฟิศ" required />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'กำลังสร้าง…' : 'สร้างกลุ่ม'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
