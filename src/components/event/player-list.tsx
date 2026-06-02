import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ParticipantRow, UserRow } from '@/lib/supabase/queries'

type ParticipantWithUser = ParticipantRow & {
  users: Pick<UserRow, 'display_name' | 'avatar_url'>
}

interface PlayerListProps {
  confirmed: ParticipantWithUser[]
  waitlist: ParticipantWithUser[]
}

function PlayerRow({
  user,
  index,
  badge,
}: {
  user: Pick<UserRow, 'display_name' | 'avatar_url'>
  index: number
  badge?: React.ReactNode
}) {
  const initials = user.display_name.slice(0, 2)
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-5 text-sm text-muted-foreground text-right shrink-0">{index}.</span>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm font-medium">{user.display_name}</span>
      {badge}
    </div>
  )
}

export function PlayerList({ confirmed, waitlist }: PlayerListProps) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <h2 className="font-semibold">รายชื่อผู้เล่น</h2>

      {confirmed.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">ยังไม่มีผู้เล่น — เป็นคนแรกได้เลย!</p>
      ) : (
        <div className="divide-y">
          {confirmed.map((p, i) => (
            <PlayerRow
              key={p.id}
              user={p.users}
              index={i + 1}
            />
          ))}
        </div>
      )}

      {waitlist.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <span>รายชื่อสำรอง</span>
              <Badge variant="secondary" className="text-xs">{waitlist.length}</Badge>
            </h3>
            <div className="divide-y">
              {waitlist.map((p) => (
                <PlayerRow
                  key={p.id}
                  user={p.users}
                  index={p.position ?? 0}
                  badge={
                    <span className="text-xs text-muted-foreground">สำรอง</span>
                  }
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
