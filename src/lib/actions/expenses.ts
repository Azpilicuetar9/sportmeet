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

export async function addExpenseItem(eventId: string, label: string, amount: number) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  // Verify organizer
  const { data: event } = await admin
    .from('events')
    .select('created_by')
    .eq('id', eventId)
    .single()

  if (!event || event.created_by !== user.id) throw new Error('Not authorized')

  const { error } = await admin.from('expense_items').insert({
    event_id: eventId,
    label,
    amount,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/groups/[groupId]/events/${eventId}/expense`)
}
