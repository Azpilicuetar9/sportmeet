import { Badge } from '@/components/ui/badge'
import type { EventRow } from '@/lib/supabase/queries'

const STATUS_LABEL: Record<EventRow['status'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  open:   { label: 'เปิดรับสมัคร', variant: 'default' },
  closed: { label: 'ปิดรับสมัคร',  variant: 'secondary' },
  done:   { label: 'จบแล้ว',        variant: 'outline' },
}

interface EventInfoCardProps {
  event: EventRow
  confirmedCount: number
}

export function EventInfoCard({ event, confirmedCount }: EventInfoCardProps) {
  const status = STATUS_LABEL[event.status]
  const startDate = new Date(event.starts_at)
  const endDate = new Date(event.ends_at)
  const isFull = confirmedCount >= event.max_players

  const dateStr = startDate.toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = `${startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-xl font-bold leading-tight">{event.title}</h1>
        <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <span className="text-foreground">{dateStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">🕐</span>
          <span className="text-foreground">{timeStr}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <span className="text-foreground">{event.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-base">🏸</span>
          <span className="text-foreground">{event.num_courts} คอร์ท</span>
        </div>
      </div>

      {/* Player count bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm font-medium">
          <span>ผู้เล่น</span>
          <span className={isFull ? 'text-destructive' : 'text-green-600'}>
            {confirmedCount}/{event.max_players} คน{isFull ? ' (เต็ม)' : ''}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${Math.min((confirmedCount / event.max_players) * 100, 100)}%` }}
          />
        </div>
      </div>

      {event.estimated_cost && (
        <p className="text-sm text-muted-foreground">
          ประมาณการ: <span className="text-foreground font-medium">฿{event.estimated_cost.toLocaleString()}</span>
        </p>
      )}
    </div>
  )
}
