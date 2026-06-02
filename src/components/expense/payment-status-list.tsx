'use client'

import { useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { reviewSlip } from '@/lib/actions/payments'
import type { ExpenseSplitRow, UserRow } from '@/lib/supabase/queries'

type SplitWithUser = ExpenseSplitRow & {
  users: Pick<UserRow, 'display_name' | 'avatar_url'>
}

const STATUS_CONFIG = {
  unpaid:         { label: 'ยังไม่จ่าย',   variant: 'destructive' as const },
  pending_review: { label: 'รอตรวจสอบ',   variant: 'secondary' as const },
  paid:           { label: 'จ่ายแล้ว',     variant: 'default' as const },
  rejected:       { label: 'สลิปไม่ถูกต้อง', variant: 'outline' as const },
}

interface PaymentStatusListProps {
  splits: SplitWithUser[]
  isOrganizer: boolean
  eventId: string
}

export function PaymentStatusList({ splits, isOrganizer, eventId }: PaymentStatusListProps) {
  const [reviewing, setReviewing] = useState<SplitWithUser | null>(null)
  const [isPending, startTransition] = useTransition()

  const paid = splits.filter(s => s.payment_status === 'paid')
  const pending = splits.filter(s => s.payment_status === 'pending_review')
  const unpaid = splits.filter(s => ['unpaid', 'rejected'].includes(s.payment_status))

  function handleReview(approved: boolean) {
    if (!reviewing) return
    startTransition(async () => {
      await reviewSlip(reviewing.id, eventId, approved)
      setReviewing(null)
    })
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">สถานะการจ่ายเงิน</h2>
          <span className="text-sm text-muted-foreground">
            {paid.length}/{splits.length} คน
          </span>
        </div>

        {/* Progress */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${splits.length > 0 ? (paid.length / splits.length) * 100 : 0}%` }}
          />
        </div>

        {/* Pending review — highlight for organizer */}
        {pending.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">รอตรวจสอบ ({pending.length})</p>
            {pending.map(s => (
              <SplitRow
                key={s.id}
                split={s}
                showReview={isOrganizer}
                onReview={() => setReviewing(s)}
              />
            ))}
          </div>
        )}

        {/* Unpaid */}
        {unpaid.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ยังไม่จ่าย ({unpaid.length})</p>
            {unpaid.map(s => (
              <SplitRow key={s.id} split={s} showReview={false} onReview={() => {}} />
            ))}
          </div>
        )}

        {/* Paid */}
        {paid.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">จ่ายแล้ว ({paid.length})</p>
            {paid.map(s => (
              <SplitRow key={s.id} split={s} showReview={false} onReview={() => {}} />
            ))}
          </div>
        )}
      </div>

      {/* Slip review dialog */}
      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ตรวจสอบสลิป — {reviewing?.users.display_name}</DialogTitle>
          </DialogHeader>
          {reviewing?.slip_url && (
            <img
              src={reviewing.slip_url}
              alt="slip"
              className="w-full rounded-lg border object-contain max-h-72"
            />
          )}
          <p className="text-sm text-center font-medium">
            ยอด ฿{reviewing?.amount_due.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              disabled={isPending}
              onClick={() => handleReview(false)}
            >
              ปฏิเสธ
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={isPending} onClick={() => handleReview(true)}>
              {isPending ? 'กำลังบันทึก…' : 'ยืนยัน จ่ายแล้ว'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SplitRow({ split, showReview, onReview }: { split: SplitWithUser; showReview: boolean; onReview: () => void }) {
  const cfg = STATUS_CONFIG[split.payment_status]
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={split.users.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{split.users.display_name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm font-medium">{split.users.display_name}</span>
      <span className="text-sm text-muted-foreground">฿{split.amount_due.toLocaleString()}</span>
      {showReview && split.payment_status === 'pending_review' ? (
        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={onReview}>
          ตรวจสอบ
        </Button>
      ) : (
        <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
      )}
    </div>
  )
}
