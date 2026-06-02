import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { JoinButton } from '@/components/group/join-button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ token: string }>
}

type GroupPreview = { name: string; sport: string; memberCount: number }

function getMockPreview(): GroupPreview {
  return { name: 'แบดวันศุกร์', sport: 'badminton', memberCount: 12 }
}

async function getGroupPreview(token: string): Promise<GroupPreview | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('groups')
    .select('name, sport')
    .eq('invite_token', token)
    .single()
  if (!data) return null

  const { count } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', data.name) // placeholder — would join properly in real app

  return { name: data.name, sport: data.sport, memberCount: count ?? 0 }
}

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params

  const preview = process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')
    ? await getGroupPreview(token)
    : getMockPreview()

  if (!preview) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold">ลิงก์ไม่ถูกต้อง</h1>
          <p className="text-sm text-muted-foreground">ลิงก์เชิญนี้หมดอายุหรือไม่ถูกต้อง</p>
          <Link href="/home"><Button variant="outline">กลับหน้าหลัก</Button></Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Group preview */}
        <div className="rounded-xl border bg-card p-6 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-5xl mx-auto">
            🏸
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{preview.name}</h1>
            <p className="text-sm text-muted-foreground">{preview.memberCount} สมาชิก</p>
          </div>
          <p className="text-sm text-muted-foreground">
            คุณได้รับเชิญให้เข้าร่วมกลุ่มนี้
          </p>

          <JoinButton token={token} />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          ต้องสมัครสมาชิกก่อน?{' '}
          <Link href={`/login?redirect=/join/${token}`} className="text-primary hover:underline">
            เข้าสู่ระบบ / สมัครสมาชิก
          </Link>
        </p>
      </div>
    </main>
  )
}
