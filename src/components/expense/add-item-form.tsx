'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { addExpenseItem } from '@/lib/actions/expenses'

export function AddItemForm({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const label = formData.get('label') as string
    const amount = parseFloat(formData.get('amount') as string)

    startTransition(async () => {
      await addExpenseItem(eventId, label, amount)
      ;(e.target as HTMLFormElement).reset()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          name="label"
          placeholder="เช่น ค่าสนาม"
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
          required
          disabled={isPending}
        />
        <input
          type="number"
          name="amount"
          placeholder="จำนวนเงิน"
          step="0.01"
          min="0"
          className="w-24 px-3 py-2 border rounded-lg text-sm"
          required
          disabled={isPending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
        >
          {isPending ? 'กำลัง...' : 'เพิ่ม'}
        </Button>
      </div>
    </form>
  )
}
