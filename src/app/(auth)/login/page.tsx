import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/home')
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-1">
          <div className="text-4xl">🏸</div>
          <h1 className="text-2xl font-bold tracking-tight">SportMeet & Split</h1>
          <p className="text-sm text-muted-foreground">
            นัดเล่นแบดมินตัน หารค่าใช้จ่ายง่ายๆ
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card shadow-sm p-6 space-y-5">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
