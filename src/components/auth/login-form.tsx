'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { signInWithEmail, signUpWithEmail } from '@/lib/actions/auth'

type Mode = 'login' | 'register'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const action = mode === 'login' ? signInWithEmail : signUpWithEmail
      const result = await action(formData)
      if (!result) return // redirect happened
      if ('error' in result && result.error) setMessage({ type: 'error', text: result.error })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'register' && (
        <div className="space-y-1.5">
          <Label htmlFor="displayName">ชื่อที่แสดง</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="เช่น นัท, บีม"
            required
            autoComplete="name"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={mode === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'}
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      {message && (
        <p
          className={`text-sm rounded-md px-3 py-2 ${
            message.type === 'error'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? 'กำลังดำเนินการ…'
          : mode === 'login'
            ? 'เข้าสู่ระบบ'
            : 'สมัครสมาชิก'}
      </Button>

      <Separator />

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}{' '}
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(null) }}
          className="text-primary font-medium hover:underline"
        >
          {mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>
      </p>
    </form>
  )
}
