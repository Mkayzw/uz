export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'tenant' | 'landlord' | 'agent'
          agent_status: 'not_applicable' | 'pending_payment' | 'active'
        }
        Insert: {
          id: string
          full_name?: string | null
          role: 'tenant' | 'landlord' | 'agent'
          agent_status?: 'not_applicable' | 'pending_payment' | 'active'
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'tenant' | 'landlord' | 'agent'
          agent_status?: 'not_applicable' | 'pending_payment' | 'active'
        }
      }
      pads: {
        Row: {
          id: string
          created_by: string | null
          title: string
          location: string | null
          image_url: string | null
          has_power: boolean
          has_water: boolean
          has_internet: boolean
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          title: string
          location?: string | null
          image_url?: string | null
          has_power?: boolean
          has_water?: boolean
          has_internet?: boolean
          view_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string | null
          title?: string
          location?: string | null
          image_url?: string | null
          has_power?: boolean
          has_water?: boolean
          has_internet?: boolean
          view_count?: number
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          pad_id: string
          name: string
          type: 'single' | 'double' | 'triple' | 'quad'
          price: number
          capacity: number
          available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pad_id: string
          name: string
          type: 'single' | 'double' | 'triple' | 'quad'
          price: number
          capacity: number
          available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pad_id?: string
          name?: string
          type?: 'single' | 'double' | 'triple' | 'quad'
          price?: number
          capacity?: number
          available?: boolean
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          room_id: string
          tenant_id: string
          transaction_code: string
          booking_time: string
          verified: boolean
        }
        Insert: {
          id?: string
          room_id: string
          tenant_id: string
          transaction_code: string
          booking_time?: string
          verified?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          tenant_id?: string
          transaction_code?: string
          booking_time?: string
          verified?: boolean
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

// Helper types for commonly used data
export type UserRole = Database['public']['Tables']['profiles']['Row']['role']
export type AgentStatus = Database['public']['Tables']['profiles']['Row']['agent_status']
export type RoomType = Database['public']['Tables']['rooms']['Row']['type']

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type PadRow = Database['public']['Tables']['pads']['Row']
export type RoomRow = Database['public']['Tables']['rooms']['Row']
export type BookingRow = Database['public']['Tables']['bookings']['Row']
