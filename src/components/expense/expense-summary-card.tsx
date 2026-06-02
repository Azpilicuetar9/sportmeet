import { Separator } from '@/components/ui/separator'
import type { ExpenseItemRow } from '@/lib/supabase/queries'

interface ExpenseSummaryCardProps {
  items: ExpenseItemRow[]
  playerCount: number
  perPerson: number
}

export function ExpenseSummaryCard({ items, playerCount, perPerson }: ExpenseSummaryCardProps) {
  const total = items.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="font-semibold">ค่าใช้จ่าย</h2>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">฿{item.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">รวมทั้งหมด</span>
          <span className="font-semibold">฿{total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">หาร {playerCount} คน</span>
          <span className="font-semibold text-primary text-base">฿{perPerson.toLocaleString()} / คน</span>
        </div>
      </div>
    </div>
  )
}
