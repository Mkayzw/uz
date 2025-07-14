export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'tenant' | 'agent'
          agent_status: 'not_applicable' | 'pending_payment' | 'active'
          is_verified_agent: boolean
        }
        Insert: {
          id: string
          full_name?: string | null
          role: 'tenant' | 'agent'
          agent_status?: 'not_applicable' | 'pending_payment' | 'active'
          is_verified_agent?: boolean
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'tenant' | 'agent'
          agent_status?: 'not_applicable' | 'pending_payment' | 'active'
          is_verified_agent?: boolean
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          property_type: string
          price: number
          bedrooms: number | null
          bathrooms: number | null
          address: string
          city: string
          state: string | null
          zip_code: string | null
          amenities: string[] | null
          images: string[] | null
          status: 'published' | 'unpublished' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          property_type: string
          price: number
          bedrooms?: number | null
          bathrooms?: number | null
          address: string
          city: string
          state?: string | null
          zip_code?: string | null
          amenities?: string[] | null
          images?: string[] | null
          status?: 'published' | 'unpublished' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          property_type?: string
          price?: number
          bedrooms?: number | null
          bathrooms?: number | null
          address?: string
          city?: string
          state?: string | null
          zip_code?: string | null
          amenities?: string[] | null
          images?: string[] | null
          status?: 'published' | 'unpublished' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      pads: {
        Row: {
          id: string
          created_by: string | null
          title: string
          description: string | null
          location: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          property_type: string | null
          bedrooms: number | null
          bathrooms: number | null
          image_urls: string[] | null
          image_url: string | null
          available_from: string | null
          available_to: string | null
          rules: string | null
          contact_phone: string | null
          contact_email: string | null
          has_internet: boolean
          has_pool: boolean
          has_parking: boolean
          has_power: boolean
          has_water: boolean
          has_tv: boolean
          has_air_conditioning: boolean
          is_furnished: boolean
          has_laundry: boolean
          has_security_system: boolean
          view_count: number
          created_at: string
          updated_at: string
          active: boolean
          price: number
        }
        Insert: {
          id?: string
          created_by?: string | null
          title: string
          description?: string | null
          location?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          property_type?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          image_urls?: string[] | null
          image_url?: string | null
          available_from?: string | null
          available_to?: string | null
          rules?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          has_internet?: boolean
          has_pool?: boolean
          has_parking?: boolean
          has_power?: boolean
          has_water?: boolean
          has_tv?: boolean
          has_air_conditioning?: boolean
          is_furnished?: boolean
          has_laundry?: boolean
          has_security_system?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          active?: boolean
          price?: number
        }
        Update: {
          id?: string
          created_by?: string | null
          title?: string
          description?: string | null
          location?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          property_type?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          image_urls?: string[] | null
          image_url?: string | null
          available_from?: string | null
          available_to?: string | null
          rules?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          has_internet?: boolean
          has_pool?: boolean
          has_parking?: boolean
          has_power?: boolean
          has_water?: boolean
          has_tv?: boolean
          has_air_conditioning?: boolean
          is_furnished?: boolean
          has_laundry?: boolean
          has_security_system?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          active?: boolean
          price?: number
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
      beds: {
        Row: {
          id: string
          room_id: string
          bed_number: number
          is_available: boolean
        }
        Insert: {
          id?: string
          room_id: string
          bed_number: number
          is_available?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          bed_number?: number
          is_available?: boolean
        }
      }
      agent_payments: {
        Row: {
          id: string
          agent_id: string
          transaction_code: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          transaction_code: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          transaction_code?: string
          verified?: boolean
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
      applications: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          status: 'pending' | 'approved' | 'rejected'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_properties: {
        Row: {
          id: string
          property_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
          created_at?: string
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
export type PropertyStatus = Database['public']['Tables']['properties']['Row']['status']

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type PadRow = Database['public']['Tables']['pads']['Row']
export type RoomRow = Database['public']['Tables']['rooms']['Row']
export type BedRow = Database['public']['Tables']['beds']['Row']
export type BookingRow = Database['public']['Tables']['bookings']['Row']
export type PropertyRow = Database['public']['Tables']['properties']['Row']
export type ApplicationRow = Database['public']['Tables']['applications']['Row']
export type SavedPropertyRow = Database['public']['Tables']['saved_properties']['Row']
