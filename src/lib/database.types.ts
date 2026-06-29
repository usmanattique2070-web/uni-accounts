export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar: string | null
          role: 'admin' | 'staff'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          avatar?: string | null
          role?: 'admin' | 'staff'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar?: string | null
          role?: 'admin' | 'staff'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      custom_fields: {
        Row: {
          id: string
          label: string
          type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean'
          options: Json
          is_required: boolean
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean'
          options?: Json
          is_required?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          type?: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean'
          options?: Json
          is_required?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          created_by_id: string | null
          status: 'new' | 'contacted' | 'follow_up' | 'enrolled' | 'rejected'
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by_id?: string | null
          status?: 'new' | 'contacted' | 'follow_up' | 'enrolled' | 'rejected'
          data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by_id?: string | null
          status?: 'new' | 'contacted' | 'follow_up' | 'enrolled' | 'rejected'
          data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      degree_programs: {
        Row: {
          id: string
          name: string
          duration: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          duration: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          duration?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          code: string
          degree_program_id: string | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          degree_program_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          degree_program_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
    Functions: Record<string, never>
  }
}
