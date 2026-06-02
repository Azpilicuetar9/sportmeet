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

export async function joinEvent(eventId: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: event } = await admin
    .from('events')
    .select('max_players, status')
    .eq('id', eventId)
    .single()

  if (!event || event.status !== 'open') throw new Error('Event not available')

  const { count: confirmedCount } = await admin
    .from('event_participants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed')

  const isFull = (confirmedCount ?? 0) >= event.max_players

  // Check if already participating (any status)
  const { data: existing } = await admin
    .from('event_participants')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.status !== 'left') return // already in event or waitlist

  if (isFull) {
    const { count: waitCount } = await admin
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'waitlist')

    const newPosition = (waitCount ?? 0) + 1

    if (existing) {
      // Re-join after leaving — update existing row
      const { error } = await admin.from('event_participants')
        .update({ status: 'waitlist', position: newPosition })
        .eq('id', existing.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await admin.from('event_participants').insert({
        event_id: eventId, user_id: user.id, status: 'waitlist', position: newPosition,
      })
      if (error) throw new Error(error.message)
    }
  } else {
    if (existing) {
      const { error } = await admin.from('event_participants')
        .update({ status: 'confirmed', position: null })
        .eq('id', existing.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await admin.from('event_participants').insert({
        event_id: eventId, user_id: user.id, status: 'confirmed',
      })
      if (error) throw new Error(error.message)
    }
  }

  revalidatePath(`/groups/[groupId]/events/${eventId}`)
}

export async function leaveEvent(eventId: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { error } = await admin
    .from('event_participants')
    .update({ status: 'left' })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/groups/[groupId]/events/${eventId}`)
}

export async function closeEventExpenses(eventId: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  // Verify organizer
  const { data: event } = await admin
    .from('events')
    .select('created_by')
    .eq('id', eventId)
    .single()

  if (!event || event.created_by !== user.id) throw new Error('Not authorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.rpc as any)('close_event_expenses', { p_event_id: eventId })
  if (error) throw new Error(error.message)
  revalidatePath(`/groups/[groupId]/events/${eventId}/expense`)
}
