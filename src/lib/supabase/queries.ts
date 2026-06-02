import type { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type UserRow = Tables<'users'>
export type GroupRow = Tables<'groups'>
export type GroupMemberRow = Tables<'group_members'>
export type EventRow = Tables<'events'>
export type ParticipantRow = Tables<'event_participants'>
export type ExpenseItemRow = Tables<'expense_items'>
export type ExpenseSplitRow = Tables<'expense_splits'>
export type PaymentQrRow = Tables<'payment_qr'>

export type EventWithDetails = EventRow & {
  expense_items: ExpenseItemRow[]
  event_participants: (ParticipantRow & { users: Pick<UserRow, 'display_name'> })[]
}

export type SplitWithUser = ExpenseSplitRow & {
  users: Pick<UserRow, 'display_name'>
}
