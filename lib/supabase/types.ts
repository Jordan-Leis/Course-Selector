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
      courses: {
        Row: {
          id: string
          subject: string
          catalog_number: string
          code: string | null
          title: string
          description: string | null
          units: number | null
          active: boolean
          last_seen_term: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          subject: string
          catalog_number: string
          code?: string | null
          title: string
          description?: string | null
          units?: number | null
          active?: boolean
          last_seen_term?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          subject?: string
          catalog_number?: string
          code?: string | null
          title?: string
          description?: string | null
          units?: number | null
          active?: boolean
          last_seen_term?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          email: string
          program: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          email: string
          program?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          program?: string | null
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      plan_terms: {
        Row: {
          id: string
          plan_id: string
          term_index: number
          label: string
        }
        Insert: {
          id?: string
          plan_id: string
          term_index: number
          label: string
        }
        Update: {
          id?: string
          plan_id?: string
          term_index?: number
          label?: string
        }
      }
      plan_term_courses: {
        Row: {
          id: string
          plan_term_id: string
          course_id: string
          position: number
        }
        Insert: {
          id?: string
          plan_term_id: string
          course_id: string
          position?: number
        }
        Update: {
          id?: string
          plan_term_id?: string
          course_id?: string
          position?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
