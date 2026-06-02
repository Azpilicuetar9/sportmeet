import Link from 'next/link'
import { CreateEventForm } from '@/components/event/create-event-form'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function CreateEventPage({ params }: PageProps) {
  const { groupId } = await params

  return (
    <main className="min-h-svh bg-muted/40">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/groups/${groupId}`} className="text-muted-foreground hover:text-foreground transition-colors">
          ← กลับ
        </Link>
        <span className="font-semibold">สร้างกิจกรรม</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="rounded-xl border bg-card p-5">
          <CreateEventForm groupId={groupId} />
        </div>
      </div>
    </main>
  )
}
