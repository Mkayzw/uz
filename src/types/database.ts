// =====================================================
// New Clean Database Types
// Generated for the rebuilt schema
// =====================================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'tenant' | 'agent' | 'admin'
          phone_number: string | null
          registration_number: string | null
          national_id: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          ecocash_number: string | null
          agent_status: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
          is_verified_agent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'tenant' | 'agent' | 'admin'
          phone_number?: string | null
          registration_number?: string | null
          national_id?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          ecocash_number?: string | null
          agent_status?: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
          is_verified_agent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'tenant' | 'agent' | 'admin'
          phone_number?: string | null
          registration_number?: string | null
          national_id?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          ecocash_number?: string | null
          agent_status?: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
          is_verified_agent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          address: string
          city: string
          state: string | null
          zip_code: string | null
          property_type: 'apartment' | 'house' | 'hostel' | 'lodge' | 'cottage' | null
          contact_phone: string | null
          contact_email: string | null
          rules: string | null
          amenities: Record<string, any> | null
          images: string[] | null
          status: 'draft' | 'published' | 'unpublished'
          available_from: string | null
          available_to: string | null
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          address: string
          city?: string
          state?: string | null
          zip_code?: string | null
          property_type?: 'apartment' | 'house' | 'hostel' | 'lodge' | 'cottage' | null
          contact_phone?: string | null
          contact_email?: string | null
          rules?: string | null
          amenities?: Record<string, any> | null
          images?: string[] | null
          status?: 'draft' | 'published' | 'unpublished'
          available_from?: string | null
          available_to?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          address?: string
          city?: string
          state?: string | null
          zip_code?: string | null
          property_type?: 'apartment' | 'house' | 'hostel' | 'lodge' | 'cottage' | null
          contact_phone?: string | null
          contact_email?: string | null
          rules?: string | null
          amenities?: Record<string, any> | null
          images?: string[] | null
          status?: 'draft' | 'published' | 'unpublished'
          available_from?: string | null
          available_to?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          property_id: string
          name: string
          room_type: 'single' | 'double' | 'triple' | 'quad'
          price_per_bed: number
          capacity: number
          bathrooms: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          name: string
          room_type: 'single' | 'double' | 'triple' | 'quad'
          price_per_bed: number
          capacity: number
          bathrooms?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          name?: string
          room_type?: 'single' | 'double' | 'triple' | 'quad'
          price_per_bed?: number
          capacity?: number
          bathrooms?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      beds: {
        Row: {
          id: string
          room_id: string
          bed_number: number
          is_occupied: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          bed_number: number
          is_occupied?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          bed_number?: number
          is_occupied?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          bed_id: string
          tenant_id: string
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          message: string | null
          transaction_code: string | null
          payment_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bed_id: string
          tenant_id: string
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          message?: string | null
          transaction_code?: string | null
          payment_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bed_id?: string
          tenant_id?: string
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          message?: string | null
          transaction_code?: string | null
          payment_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      agent_payments: {
        Row: {
          id: string
          agent_id: string
          transaction_code: string
          amount: number
          payment_verified: boolean
          verified_by: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          transaction_code: string
          amount?: number
          payment_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          transaction_code?: string
          amount?: number
          payment_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
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
      property_views: {
        Row: {
          id: string
          property_id: string
          viewer_id: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          viewer_id?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          viewer_id?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          title: string
          property_id: string | null
          application_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          property_id?: string | null
          application_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          property_id?: string | null
          application_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_participants: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      property_stats: {
        Row: {
          id: string
          title: string
          owner_id: string
          status: 'draft' | 'published' | 'unpublished'
          total_rooms: number
          total_beds: number
          occupied_beds: number
          available_beds: number
          occupancy_rate: number
          min_price: number
          max_price: number
          view_count: number
          created_at: string
          updated_at: string
        }
      }
      application_details: {
        Row: {
          id: string
          bed_id: string
          tenant_id: string
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          message: string | null
          transaction_code: string | null
          payment_verified: boolean
          created_at: string
          updated_at: string
          tenant_name: string | null
          tenant_ecocash: string | null
          registration_number: string | null
          national_id: string | null
          bed_number: number
          room_id: string
          room_name: string
          price_per_bed: number
          property_id: string
          property_title: string
          address: string
          property_owner_id: string
          agent_name: string | null
          agent_contact: string | null
          agent_ecocash: string | null
        }
      }
    }
    Functions: {
      get_property_stats: {
        Args: { property_uuid: string }
        Returns: {
          total_rooms: number
          total_beds: number
          occupied_beds: number
          available_beds: number
          occupancy_rate: number
        }[]
      }
      increment_property_views: {
        Args: {
          property_uuid: string
          viewer_uuid?: string
          viewer_ip?: string
        }
        Returns: void
      }
      approve_application: {
        Args: { application_uuid: string }
        Returns: void
      }
      reject_application: {
        Args: { application_uuid: string }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type Bed = Database['public']['Tables']['beds']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type AgentPayment = Database['public']['Tables']['agent_payments']['Row']
export type SavedProperty = Database['public']['Tables']['saved_properties']['Row']
export type PropertyView = Database['public']['Tables']['property_views']['Row']
export type Chat = Database['public']['Tables']['chats']['Row']
export type ChatParticipant = Database['public']['Tables']['chat_participants']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

// View types
export type PropertyStats = Database['public']['Views']['property_stats']['Row']
export type ApplicationDetails = Database['public']['Views']['application_details']['Row']

// Legacy type aliases for backward compatibility
export type ProfileRow = Profile
export type PropertyRow = Property
export type RoomRow = Room
export type BedRow = Bed
export type ApplicationRow = Application
export type SavedPropertyRow = SavedProperty

// Amenities type for better type safety
export interface PropertyAmenities {
  utilities?: {
    internet?: boolean
    power?: boolean
    water?: boolean
  }
  facilities?: {
    pool?: boolean
    parking?: boolean
    laundry?: boolean
    security_system?: boolean
  }
  room_features?: {
    air_conditioning?: boolean
    tv?: boolean
    furnished?: boolean
  }
}
