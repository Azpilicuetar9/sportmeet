export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type PaymentStatus = 'unpaid' | 'pending_review' | 'paid' | 'rejected'
export type ParticipantStatus = 'confirmed' | 'waitlist' | 'left'
export type EventStatus = 'open' | 'closed' | 'done'
export type GroupRole = 'organizer' | 'member'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string
          phone: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          sport: string
          cover_url: string | null
          invite_token: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sport?: string
          cover_url?: string | null
          invite_token?: string
          created_by: string
          created_at?: string
        }
        Update: {
          name?: string
          sport?: string
          cover_url?: string | null
        }
        Relationships: [
          { foreignKeyName: 'groups_created_by_fkey'; columns: ['created_by']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: GroupRole
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: GroupRole
          joined_at?: string
        }
        Update: {
          role?: GroupRole
        }
        Relationships: [
          { foreignKeyName: 'group_members_group_id_fkey'; columns: ['group_id']; referencedRelation: 'groups'; referencedColumns: ['id'] },
          { foreignKeyName: 'group_members_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      events: {
        Row: {
          id: string
          group_id: string
          title: string
          location: string | null
          starts_at: string
          ends_at: string
          max_players: number
          num_courts: number
          status: EventStatus
          estimated_cost: number | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          location?: string | null
          starts_at: string
          ends_at: string
          max_players: number
          num_courts?: number
          status?: EventStatus
          estimated_cost?: number | null
          created_by: string
          created_at?: string
        }
        Update: {
          title?: string
          location?: string | null
          starts_at?: string
          ends_at?: string
          max_players?: number
          num_courts?: number
          status?: EventStatus
          estimated_cost?: number | null
        }
        Relationships: [
          { foreignKeyName: 'events_group_id_fkey'; columns: ['group_id']; referencedRelation: 'groups'; referencedColumns: ['id'] },
          { foreignKeyName: 'events_created_by_fkey'; columns: ['created_by']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: ParticipantStatus
          position: number | null
          joined_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: ParticipantStatus
          position?: number | null
          joined_at?: string
        }
        Update: {
          status?: ParticipantStatus
          position?: number | null
        }
        Relationships: [
          { foreignKeyName: 'event_participants_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'event_participants_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      expense_items: {
        Row: {
          id: string
          event_id: string
          label: string
          amount: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          label: string
          amount: number
          created_by: string
          created_at?: string
        }
        Update: {
          label?: string
          amount?: number
        }
        Relationships: [
          { foreignKeyName: 'expense_items_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] }
        ]
      }
      expense_splits: {
        Row: {
          id: string
          event_id: string
          user_id: string
          amount_due: number
          payment_status: PaymentStatus
          slip_url: string | null
          slip_uploaded_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          amount_due: number
          payment_status?: PaymentStatus
          slip_url?: string | null
          slip_uploaded_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          payment_status?: PaymentStatus
          slip_url?: string | null
          slip_uploaded_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          { foreignKeyName: 'expense_splits_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'expense_splits_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      payment_qr: {
        Row: {
          id: string
          event_id: string
          qr_url: string
          bank_info: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          qr_url: string
          bank_info?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          qr_url?: string
          bank_info?: string | null
        }
        Relationships: [
          { foreignKeyName: 'payment_qr_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      close_event_expenses: {
        Args: { p_event_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
