'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function uploadSlip(eventId: string, slipFile: File) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const ext = slipFile.name.split('.').pop()
  const path = `slips/${eventId}/${user.id}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('payments')
    .upload(path, slipFile, { upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = admin.storage.from('payments').getPublicUrl(path)

  const { error } = await admin
    .from('expense_splits')
    .update({
      slip_url: publicUrl,
      slip_uploaded_at: new Date().toISOString(),
      payment_status: 'pending_review',
    })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/groups/[groupId]/events/${eventId}/expense`)
}

export async function reviewSlip(splitId: string, eventId: string, approved: boolean) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  // Verify organizer
  const { data: event } = await admin
    .from('events')
    .select('created_by')
    .eq('id', eventId)
    .single()

  if (!event || event.created_by !== user.id) throw new Error('Not authorized')

  const { error } = await admin
    .from('expense_splits')
    .update({
      payment_status: approved ? 'paid' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', splitId)

  if (error) throw new Error(error.message)
  revalidatePath(`/groups/[groupId]/events/${eventId}/expense`)
}
