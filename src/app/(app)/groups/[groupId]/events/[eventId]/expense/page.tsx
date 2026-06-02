import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExpenseSummaryCard } from '@/components/expense/expense-summary-card'
import { PaymentStatusList } from '@/components/expense/payment-status-list'
import { PaymentQrCard } from '@/components/expense/payment-qr-card'
import { SlipUploadButton } from '@/components/expense/slip-upload-button'
import { ShareLineButton } from '@/components/event/share-line-button'
import { AddItemForm } from '@/components/expense/add-item-form'
import type {
  EventRow, ExpenseItemRow, ExpenseSplitRow, UserRow, PaymentQrRow
} from '@/lib/supabase/queries'

type SplitWithUser = ExpenseSplitRow & {
  users: Pick<UserRow, 'display_name' | 'avatar_url'>
}

// ─── Mock data ────────────────────────────────────────────────
function getMockData(eventId: string) {
  const items: ExpenseItemRow[] = [
    { id: '1', event_id: eventId, label: 'ค่าสนาม',   amount: 800,  created_by: 'u0', created_at: '' },
    { id: '2', event_id: eventId, label: 'ค่าลูกแบด', amount: 280,  created_by: 'u0', created_at: '' },
    { id: '3', event_id: eventId, label: 'ค่าน้ำ',    amount: 120,  created_by: 'u0', created_at: '' },
  ]
  const perPerson = 150

  const names = [
    { name: 'นัท',  status: 'paid'           },
    { name: 'บีม',  status: 'paid'           },
    { name: 'โอม',  status: 'pending_review' },
    { name: 'แพร',  status: 'paid'           },
    { name: 'บอล',  status: 'unpaid'         },
    { name: 'เจ',   status: 'unpaid'         },
    { name: 'มายด์', status: 'paid'          },
    { name: 'ต้น',  status: 'pending_review' },
  ]

  const splits: SplitWithUser[] = names.map((n, i) => ({
    id: `s${i}`,
    event_id: eventId,
    user_id: `u${i}`,
    amount_due: perPerson,
    payment_status: n.status as ExpenseSplitRow['payment_status'],
    slip_url: n.status !== 'unpaid' ? 'https://placehold.co/300x400/f0f0f0/333?text=Slip' : null,
    slip_uploaded_at: n.status !== 'unpaid' ? new Date().toISOString() : null,
    reviewed_at: n.status === 'paid' ? new Date().toISOString() : null,
    reviewed_by: n.status === 'paid' ? 'u0' : null,
    users: { display_name: n.name, avatar_url: null },
  }))

  const event: Pick<EventRow, 'id' | 'title' | 'created_by'> = {
    id: eventId,
    title: 'แบดมินตันวันศุกร์',
    created_by: 'u0',
  }

  return { items, splits, perPerson, event, qr: null }
}

interface PageProps {
  params: Promise<{ groupId: string; eventId: string }>
}

export default async function ExpensePage({ params }: PageProps) {
  const { groupId, eventId } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')) {
    const { items, splits, perPerson, event, qr } = getMockData(eventId)
    return (
      <ExpenseView
        eventId={eventId}
        groupId={groupId}
        eventTitle={event.title}
        items={items}
        splits={splits}
        perPerson={perPerson}
        qr={qr}
        isOrganizer={true}
        myStatus="paid"
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: event }, { data: rawItems }, { data: rawSplits }, { data: qr }] = await Promise.all([
    supabase.from('events').select('id, title, created_by').eq('id', eventId).single(),
    supabase.from('expense_items').select('*').eq('event_id', eventId),
    supabase.from('expense_splits').select('*, users(display_name, avatar_url)').eq('event_id', eventId),
    supabase.from('payment_qr').select('*').eq('event_id', eventId).maybeSingle(),
  ])

  if (!event) notFound()

  const items = (rawItems ?? []) as ExpenseItemRow[]
  const splits = (rawSplits ?? []) as SplitWithUser[]
  const total = items.reduce((sum, i) => sum + i.amount, 0)
  const perPerson = splits.length > 0 ? splits[0].amount_due : Math.round(total / Math.max(splits.length, 1))
  const isOrganizer = event.created_by === user?.id
  const mySplit = splits.find(s => s.user_id === user?.id)

  return (
    <ExpenseView
      eventId={eventId}
      groupId={groupId}
      eventTitle={event.title}
      items={items}
      splits={splits}
      perPerson={perPerson}
      qr={qr as PaymentQrRow | null}
      isOrganizer={isOrganizer}
      myStatus={mySplit?.payment_status ?? null}
    />
  )
}

function ExpenseView({
  eventId, groupId, eventTitle, items, splits, perPerson, qr, isOrganizer, myStatus,
}: {
  eventId: string
  groupId: string
  eventTitle: string
  items: ExpenseItemRow[]
  splits: SplitWithUser[]
  perPerson: number
  qr: PaymentQrRow | null
  isOrganizer: boolean
  myStatus: string | null
}) {
  return (
    <main className="min-h-svh bg-muted/40">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/groups/${groupId}/events/${eventId}`} className="text-muted-foreground hover:text-foreground transition-colors">
          ← กลับ
        </Link>
        <span className="font-semibold truncate">สรุปค่าใช้จ่าย</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Expense breakdown */}
        <ExpenseSummaryCard items={items} playerCount={splits.length} perPerson={perPerson} />

        {/* Add expense item (organizer only) */}
        {isOrganizer && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold">เพิ่มรายการค่าใช้จ่าย</p>
            <AddItemForm eventId={eventId} />
          </div>
        )}

        {/* Expense items list */}
        {items.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold">รายการค่าใช้จ่าย ({items.length})</p>
            <div className="space-y-1">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">฿{item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My amount callout (non-organizer) */}
        {!isOrganizer && myStatus !== 'paid' && (
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ยอดที่ต้องจ่าย</p>
              <p className="text-2xl font-bold text-primary">฿{perPerson.toLocaleString()}</p>
            </div>
            {myStatus === 'pending_review' && (
              <span className="text-sm text-amber-600 font-medium">รอตรวจสอบ…</span>
            )}
          </div>
        )}

        {/* QR code */}
        <PaymentQrCard qr={qr} />

        {/* Upload slip (member only, not yet paid) */}
        {!isOrganizer && myStatus !== 'paid' && (
          <SlipUploadButton eventId={eventId} currentStatus={myStatus ?? 'unpaid'} />
        )}

        {/* Share to LINE */}
        <ShareLineButton eventId={eventId} type="expense" />

        {/* Payment status list */}
        <PaymentStatusList splits={splits} isOrganizer={isOrganizer} eventId={eventId} />
      </div>
    </main>
  )
}
