import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InviteCopyButton } from '@/components/group/invite-copy-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { EventRow, UserRow, GroupRow } from '@/lib/supabase/queries'

type EventSummary = Pick<EventRow, 'id' | 'title' | 'location' | 'starts_at' | 'status' | 'max_players'> & {
  confirmed_count: number
}
type MemberSummary = { user_id: string; role: string; users: Pick<UserRow, 'display_name' | 'avatar_url'> }

function getMockGroupData(groupId: string) {
  const group: GroupRow = {
    id: groupId, name: 'แบดวันศุกร์', sport: 'badminton',
    cover_url: null, invite_token: 'abc123tok',
    created_by: 'u0', created_at: new Date().toISOString(),
  }
  const now = new Date()
  const d1 = new Date(now); d1.setDate(now.getDate() + 3); d1.setHours(19, 0)
  const d2 = new Date(now); d2.setDate(now.getDate() - 7); d2.setHours(19, 0)

  const events: EventSummary[] = [
    { id: 'e1', title: 'แบดมินตันวันศุกร์',   location: 'สนาม ABC', starts_at: d1.toISOString(), status: 'open', max_players: 8, confirmed_count: 6 },
    { id: 'e2', title: 'แบดมินตัน 23 พ.ค.',   location: 'สนาม ABC', starts_at: d2.toISOString(), status: 'done', max_players: 8, confirmed_count: 8 },
  ]
  const members: MemberSummary[] = [
    { user_id: 'u0', role: 'organizer', users: { display_name: 'นัท',  avatar_url: null } },
    { user_id: 'u1', role: 'member',    users: { display_name: 'บีม',  avatar_url: null } },
    { user_id: 'u2', role: 'member',    users: { display_name: 'โอม',  avatar_url: null } },
    { user_id: 'u3', role: 'member',    users: { display_name: 'แพร',  avatar_url: null } },
    { user_id: 'u4', role: 'member',    users: { display_name: 'บอล',  avatar_url: null } },
  ]
  return { group, events, members, isOrganizer: true, inviteUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://sportmeet.app'}/join/abc123tok` }
}

const STATUS_MAP: Record<EventRow['status'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  open:   { label: 'เปิดรับ',  variant: 'default' },
  closed: { label: 'ปิดรับ',   variant: 'secondary' },
  done:   { label: 'จบแล้ว',   variant: 'outline' },
}

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { groupId } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')) {
    const { group, events, members, isOrganizer } = getMockGroupData(groupId)
    return <GroupView group={group} events={events} members={members} isOrganizer={isOrganizer} groupId={groupId} inviteToken="abc123tok" />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single()
  if (!group) notFound()

  const [{ data: rawMembers }, { data: rawEvents }] = await Promise.all([
    supabase.from('group_members').select('user_id, role, users(display_name, avatar_url)').eq('group_id', groupId),
    supabase.from('events').select('id, title, location, starts_at, status, max_players').eq('group_id', groupId).order('starts_at', { ascending: false }),
  ])

  const members = (rawMembers ?? []) as MemberSummary[]
  const events = (rawEvents ?? []) as EventSummary[]
  const myMember = members.find(m => m.user_id === user?.id)
  const isOrganizer = myMember?.role === 'organizer'

  return <GroupView group={group as GroupRow} events={events} members={members} isOrganizer={isOrganizer} groupId={groupId} inviteToken={group.invite_token} />
}

function GroupView({ group, events, members, isOrganizer, groupId, inviteToken }: {
  group: GroupRow; events: EventSummary[]; members: MemberSummary[]
  isOrganizer: boolean; groupId: string; inviteToken: string
}) {
  const upcoming = events.filter(e => e.status === 'open' || e.status === 'closed')
  const past     = events.filter(e => e.status === 'done')

  return (
    <main className="min-h-svh bg-muted/40">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors">← กลับ</Link>
        <span className="font-semibold truncate">{group.name}</span>
        {isOrganizer && (
          <Link href={`/groups/${groupId}/events/new`} className="ml-auto">
            <Button size="sm">+ สร้างกิจกรรม</Button>
          </Link>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Group header */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl shrink-0">🏸</div>
            <div>
              <h1 className="text-lg font-bold">{group.name}</h1>
              <p className="text-sm text-muted-foreground">{members.length} สมาชิก</p>
            </div>
          </div>

          {/* Invite link — client component handles copy */}
          <InviteCopyButton token={inviteToken} />
        </div>

        {/* Members */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">สมาชิก</h2>
          <div className="flex flex-wrap gap-3">
            {members.map(m => (
              <div key={m.user_id} className="flex flex-col items-center gap-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={m.users.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{m.users.display_name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-center max-w-[48px] truncate">{m.users.display_name}</span>
                {m.role === 'organizer' && <span className="text-[10px] text-primary font-medium">ผู้จัด</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <section className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">กิจกรรมที่กำลังจะมา</h2>
          {upcoming.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีกิจกรรม</p>
            : upcoming.map(ev => <EventCard key={ev.id} ev={ev} groupId={groupId} />)
          }
        </section>

        {past.length > 0 && (
          <>
            <Separator />
            <section className="space-y-2">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">ประวัติกิจกรรม</h2>
              {past.map(ev => <EventCard key={ev.id} ev={ev} groupId={groupId} />)}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function EventCard({ ev, groupId }: { ev: EventSummary; groupId: string }) {
  const d = new Date(ev.starts_at)
  const cfg = STATUS_MAP[ev.status]
  return (
    <Link href={`/groups/${groupId}/events/${ev.id}`} className="block rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{ev.title}</p>
        <Badge variant={cfg.variant} className="text-xs shrink-0">{cfg.label}</Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>📅 {d.toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' })} {d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
        {ev.location && <span>📍 {ev.location}</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((ev.confirmed_count / ev.max_players) * 100, 100)}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{ev.confirmed_count}/{ev.max_players}</span>
      </div>
    </Link>
  )
}

