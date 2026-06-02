import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { EventWithDetails, SplitWithUser } from '@/lib/supabase/queries'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const eventId = searchParams.get('eventId')
  const type = searchParams.get('type') ?? 'roster'

  if (!eventId) return new Response('Missing eventId', { status: 400 })

  const supabase = await createClient()

  const { data } = await supabase
    .from('events')
    .select('*, expense_items(*), event_participants(*, users(display_name))')
    .eq('id', eventId)
    .single()

  const event = data as EventWithDetails | null
  if (!event) return new Response('Not found', { status: 404 })

  const confirmed = event.event_participants.filter(p => p.status === 'confirmed')
  const waitlist = event.event_participants.filter(p => p.status === 'waitlist')

  if (type === 'expense') {
    const { data: rawSplits } = await supabase
      .from('expense_splits')
      .select('*, users(display_name)')
      .eq('event_id', eventId)

    const splits = (rawSplits ?? []) as SplitWithUser[]
    const paid = splits.filter(s => s.payment_status === 'paid')
    const unpaid = splits.filter(s => s.payment_status !== 'paid')
    const total = event.expense_items.reduce((sum, i) => sum + i.amount, 0)
    const perPerson = splits[0]?.amount_due ?? Math.round(total / Math.max(confirmed.length, 1))

    return new ImageResponse(
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#fff', padding: '40px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
          สรุปค่าใช้จ่าย — {event.title}
        </div>
        <div style={{ display: 'flex', fontSize: 16, color: '#666', marginBottom: 24 }}>
          {new Date(event.starts_at).toLocaleDateString('th-TH', { dateStyle: 'long' })} · {event.location ?? ''}
        </div>
        {event.expense_items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, marginBottom: 6 }}>
            <span>{item.label}</span>
            <span>{item.amount.toLocaleString()} บาท</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, borderTop: '2px solid #eee', paddingTop: 12, marginTop: 8 }}>
          <span>รวม ({confirmed.length} คน)</span>
          <span>คนละ {perPerson.toLocaleString()} บาท</span>
        </div>
        <div style={{ display: 'flex', marginTop: 20, gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: '#16a34a', fontSize: 16 }}>จ่ายแล้ว ✓</span>
            {paid.map(s => <span key={s.id} style={{ fontSize: 15 }}>{s.users.display_name}</span>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: '#dc2626', fontSize: 16 }}>ยังไม่จ่าย</span>
            {unpaid.map(s => <span key={s.id} style={{ fontSize: 15 }}>{s.users.display_name}</span>)}
          </div>
        </div>
      </div>,
      { width: 800, height: 600 },
    )
  }

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#fff', padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{event.title}</div>
      <div style={{ display: 'flex', fontSize: 16, color: '#666', marginBottom: 4 }}>
        {new Date(event.starts_at).toLocaleDateString('th-TH', { dateStyle: 'long' })} ·{' '}
        {new Date(event.starts_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}–
        {new Date(event.ends_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div style={{ display: 'flex', fontSize: 16, color: '#666', marginBottom: 20 }}>
        {event.location ?? ''} · {confirmed.length}/{event.max_players} คน · {event.num_courts} คอร์ท
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {confirmed.map((p, i) => (
          <span key={p.id} style={{ fontSize: 16 }}>{i + 1}. {p.users.display_name}</span>
        ))}
      </div>
      {waitlist.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
          <span style={{ fontWeight: 600, color: '#9333ea', fontSize: 15 }}>สำรอง:</span>
          {waitlist.map(p => (
            <span key={p.id} style={{ fontSize: 15 }}>{p.position}. {p.users.display_name}</span>
          ))}
        </div>
      )}
    </div>,
    { width: 800, height: 600 },
  )
}
