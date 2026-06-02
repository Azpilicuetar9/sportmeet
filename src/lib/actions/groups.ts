'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function createGroup(formData: FormData) {
  const user = await getAuthUser()
  const admin = createAdminClient()
  const name = formData.get('name') as string

  // Generate random invite token
  const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  const { data: group, error } = await admin
    .from('groups')
    .insert({ name, created_by: user.id, invite_token: inviteToken })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const { error: memberError } = await admin.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'organizer',
  })

  if (memberError) return { error: `ไม่สามารถเพิ่มสมาชิก: ${memberError.message}` }

  redirect(`/groups/${group.id}`)
}

export async function joinGroupByToken(token: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: group, error } = await admin
    .from('groups')
    .select('id')
    .eq('invite_token', token)
    .single()

  if (error || !group) return { error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' }

  const { error: joinError } = await admin.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'member',
  })

  if (joinError && joinError.code !== '23505') return { error: joinError.message }

  revalidatePath(`/groups/${group.id}`)
  redirect(`/groups/${group.id}`)
}
