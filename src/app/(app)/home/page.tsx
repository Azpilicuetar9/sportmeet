import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile, groups, upcoming events, pending payments in parallel
  const [
    { data: profile },
    { data: memberships },
    { data: myParticipations },
    { data: pendingSplits },
  ] = await Promise.all([
    supabase.from('users').select('display_name').eq('id', user.id).single(),
    supabase.from('group_members').select('group_id, role, groups(id, name)').eq('user_id', user.id),
    supabase
      .from('event_participants')
      .select('status, events(id, group_id, title, location, starts_at, status, max_players)')
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'waitlist']),
    supabase
      .from('expense_splits')
      .select('amount_due, event_id, events(title, group_id)')
      .eq('user_id', user.id)
      .eq('payment_status', 'unpaid'),
  ])

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'คุณ'

  type Group = { id: string; name: string; role: string }
  const myGroups: Group[] = (memberships ?? []).map((m: { group_id: string; role: string; groups: { id: string; name: string } | null }) => ({
    id: m.groups?.id ?? m.group_id,
    name: m.groups?.name ?? '',
    role: m.role,
  }))

  type UpcomingEvent = {
    id: string; groupId: string; title: string; location: string | null
    starts_at: string; maxPlayers: number; myStatus: string
  }
  const upcomingEvents: UpcomingEvent[] = (myParticipations ?? [])
    .filter((p: { events: { status: string } | null }) => p.events?.status === 'open' || p.events?.status === 'closed')
    .map((p: { status: string; events: { id: string; group_id: string; title: string; location: string | null; starts_at: string; max_players: number } | null }) => ({
      id: p.events?.id ?? '',
      groupId: p.events?.group_id ?? '',
      title: p.events?.title ?? '',
      location: p.events?.location ?? null,
      starts_at: p.events?.starts_at ?? '',
      maxPlayers: p.events?.max_players ?? 0,
      myStatus: p.status,
    }))
    .sort((a: UpcomingEvent, b: UpcomingEvent) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  type PendingPayment = { eventId: string; groupId: string; title: string; amount: number }
  const pendingPayments: PendingPayment[] = (pendingSplits ?? []).map((s: { amount_due: number; event_id: string; events: { title: string; group_id: string } | null }) => ({
    eventId: s.event_id,
    groupId: s.events?.group_id ?? '',
    title: s.events?.title ?? '',
    amount: s.amount_due,
  }))

  return (
    <main className="min-h-svh bg-muted/40">
      <div className="bg-background border-b px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">สวัสดี</p>
          <h1 className="text-lg font-bold">{displayName} 👋</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/groups/new">
            <Button size="sm">+ สร้างกลุ่ม</Button>
          </Link>
          <form action={signOut}>
            <Button type="submit" size="sm" variant="outline">ออกจากระบบ</Button>
          </form>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">

        {/* Pending payments */}
        {pendingPayments.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">💰 ค้างจ่าย {pendingPayments.length} รายการ</p>
            {pendingPayments.map(p => (
              <Link
                key={p.eventId}
                href={`/groups/${p.groupId}/events/${p.eventId}/expense`}
                className="flex items-center justify-between rounded-lg bg-white border px-3 py-2 hover:bg-amber-50 transition-colors"
              >
                <span className="text-sm">{p.title}</span>
                <span className="text-sm font-bold text-amber-700">฿{p.amount.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Upcoming events */}
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">กิจกรรมที่กำลังจะมาถึง</h2>
          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">ยังไม่มีกิจกรรม</p>
              <p className="text-xs text-muted-foreground">เข้าร่วมกลุ่มหรือสร้างกิจกรรมใหม่</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(ev => {
                const d = new Date(ev.starts_at)
                return (
                  <Link key={ev.id} href={`/groups/${ev.groupId}/events/${ev.id}`}
                    className="block rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{ev.title}</p>
                      {ev.myStatus === 'confirmed'
                        ? <Badge variant="default" className="text-xs shrink-0">ลงชื่อแล้ว</Badge>
                        : <Badge variant="secondary" className="text-xs shrink-0">สำรอง</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>📅 {d.toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' })} {d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      {ev.location && <span>📍 {ev.location}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* My groups */}
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">กลุ่มของฉัน</h2>
          {myGroups.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">ยังไม่ได้เข้าร่วมกลุ่มไหน</p>
              <Link href="/groups/new">
                <Button size="sm" variant="outline">สร้างกลุ่มแรก</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myGroups.map(g => (
                <Link key={g.id} href={`/groups/${g.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">🏸</div>
                  <p className="flex-1 font-medium text-sm truncate">{g.name}</p>
                  {g.role === 'organizer' && <Badge variant="outline" className="text-xs shrink-0">ผู้จัด</Badge>}
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
