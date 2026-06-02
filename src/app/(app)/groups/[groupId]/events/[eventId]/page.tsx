import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventInfoCard } from '@/components/event/event-info-card'
import { PlayerList } from '@/components/event/player-list'
import { JoinLeaveButton } from '@/components/event/join-leave-button'
import { ShareLineButton } from '@/components/event/share-line-button'
import type { EventRow, ParticipantRow, UserRow } from '@/lib/supabase/queries'
import Link from 'next/link'

type ParticipantWithUser = ParticipantRow & {
  users: Pick<UserRow, 'display_name' | 'avatar_url'>
}

// ─── Mock data for UI preview (used when Supabase not configured) ───
function getMockEvent(eventId: string, groupId: string): {
  event: EventRow
  confirmed: ParticipantWithUser[]
  waitlist: ParticipantWithUser[]
  currentStatus: 'confirmed' | 'waitlist' | 'left' | null
} {
  const now = new Date()
  const starts = new Date(now); starts.setHours(19, 0, 0, 0); starts.setDate(now.getDate() + 3)
  const ends = new Date(starts); ends.setHours(21, 0, 0, 0)

  const event: EventRow = {
    id: eventId,
    group_id: groupId,
    title: 'แบดมินตันวันศุกร์',
    location: 'สนาม ABC Sport Complex',
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    max_players: 8,
    num_courts: 2,
    status: 'open',
    estimated_cost: 1200,
    created_by: 'mock-organizer',
    created_at: new Date().toISOString(),
  }

  const names = ['นัท', 'บีม', 'โอม', 'แพร', 'บอล', 'เจ']
  const confirmed: ParticipantWithUser[] = names.map((name, i) => ({
    id: `p${i}`,
    event_id: eventId,
    user_id: `u${i}`,
    status: 'confirmed',
    position: null,
    joined_at: new Date().toISOString(),
    users: { display_name: name, avatar_url: null },
  }))

  const waitlist: ParticipantWithUser[] = [
    { id: 'w1', event_id: eventId, user_id: 'uw1', status: 'waitlist', position: 1, joined_at: new Date().toISOString(), users: { display_name: 'กัน', avatar_url: null } },
    { id: 'w2', event_id: eventId, user_id: 'uw2', status: 'waitlist', position: 2, joined_at: new Date().toISOString(), users: { display_name: 'เต้', avatar_url: null } },
  ]

  return { event, confirmed, waitlist, currentStatus: null }
}

interface PageProps {
  params: Promise<{ groupId: string; eventId: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { groupId, eventId } = await params

  // Preview mode: use mock data when Supabase not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')) {
    const { event, confirmed, waitlist, currentStatus } = getMockEvent(eventId, groupId)
    return <EventDetailView
      event={event}
      confirmed={confirmed}
      waitlist={waitlist}
      currentStatus={currentStatus}
      groupId={groupId}
    />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('events')
    .select('*, event_participants(*, users(display_name, avatar_url))')
    .eq('id', eventId)
    .single()

  if (!data) notFound()

  const event = data as unknown as EventRow
  const participants = (data as unknown as { event_participants: ParticipantWithUser[] }).event_participants

  const confirmed = participants.filter(p => p.status === 'confirmed')
  const waitlist = participants.filter(p => p.status === 'waitlist').sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const mine = user ? participants.find(p => p.user_id === user.id) : null
  const currentStatus = mine?.status ?? null

  return <EventDetailView
    event={event}
    confirmed={confirmed}
    waitlist={waitlist}
    currentStatus={currentStatus as 'confirmed' | 'waitlist' | 'left' | null}
    groupId={groupId}
  />
}

function EventDetailView({
  event,
  confirmed,
  waitlist,
  currentStatus,
  groupId,
}: {
  event: EventRow
  confirmed: ParticipantWithUser[]
  waitlist: ParticipantWithUser[]
  currentStatus: 'confirmed' | 'waitlist' | 'left' | null
  groupId: string
}) {
  const isFull = confirmed.length >= event.max_players

  return (
    <main className="min-h-svh bg-muted/40">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/groups/${groupId}`} className="text-muted-foreground hover:text-foreground transition-colors">
          ← กลับ
        </Link>
        <span className="font-semibold truncate">{event.title}</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Event info */}
        <EventInfoCard event={event} confirmedCount={confirmed.length} />

        {/* Action buttons */}
        <div className="space-y-2">
          <JoinLeaveButton
            eventId={event.id}
            currentStatus={currentStatus}
            isFull={isFull}
            eventOpen={event.status === 'open'}
          />
          <ShareLineButton eventId={event.id} type="roster" />
        </div>

        {/* Player list */}
        <PlayerList confirmed={confirmed} waitlist={waitlist} />

        {/* Expense link (shown after event is done) */}
        {event.status === 'done' && (
          <Link
            href={`/groups/${groupId}/events/${event.id}/expense`}
            className="block rounded-xl border bg-card p-4 text-center text-sm font-medium hover:bg-muted transition-colors"
          >
            ดูสรุปค่าใช้จ่าย →
          </Link>
        )}
      </div>
    </main>
  )
}
