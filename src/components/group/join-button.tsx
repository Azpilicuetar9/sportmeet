'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { joinGroupByToken } from '@/lib/actions/groups'

export function JoinButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(async () => { await joinGroupByToken(token) })}
    >
      {isPending ? 'กำลังเข้าร่วม…' : 'เข้าร่วมกลุ่ม'}
    </Button>
  )
}
