'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createEvent(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = createAdminClient()
  const title         = formData.get('title') as string
  const location      = formData.get('location') as string
  const date          = formData.get('date') as string
  const timeStart     = formData.get('timeStart') as string
  const timeEnd       = formData.get('timeEnd') as string
  const maxPlayers    = parseInt(formData.get('maxPlayers') as string, 10)
  const numCourts     = parseInt(formData.get('numCourts') as string, 10)
  const estimatedCost = formData.get('estimatedCost') ? parseFloat(formData.get('estimatedCost') as string) : null

  const { data: event, error } = await admin.from('events').insert({
    group_id:       groupId,
    title,
    location:       location || null,
    starts_at:      `${date}T${timeStart}:00`,
    ends_at:        `${date}T${timeEnd}:00`,
    max_players:    maxPlayers,
    num_courts:     numCourts,
    estimated_cost: estimatedCost,
    created_by:     user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  redirect(`/groups/${groupId}/events/${event.id}`)
}
