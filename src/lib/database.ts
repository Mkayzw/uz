import { supabase } from './supabaseClient'

export interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'landlord' | 'agent'
  agent_status: 'not_applicable' | 'pending_payment' | 'active'
}

export interface Pad {
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

export interface Room {
  id: string
  pad_id: string
  name: string
  type: 'single' | 'double' | 'triple' | 'quad'
  price: number
  capacity: number
  available: boolean
  created_at: string
}

export interface Booking {
  id: string
  room_id: string
  tenant_id: string
  transaction_code: string
  booking_time: string
  verified: boolean
}

// User Profile Operations
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

// Pad Operations
export const getAllPads = async (): Promise<Pad[]> => {
  const { data, error } = await supabase
    .from('pads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pads:', error)
    throw error
  }

  return data || []
}

export const getPadsByUser = async (userId: string): Promise<Pad[]> => {
  const { data, error } = await supabase
    .from('pads')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user pads:', error)
    throw error
  }

  return data || []
}

export const createPad = async (padData: Omit<Pad, 'id' | 'created_at' | 'view_count'>) => {
  const { data, error } = await supabase
    .from('pads')
    .insert(padData)
    .select()
    .single()

  if (error) {
    console.error('Error creating pad:', error)
    throw error
  }

  return data
}

// Room Operations
export const getRoomsByPad = async (padId: string): Promise<Room[]> => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('pad_id', padId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching rooms:', error)
    throw error
  }

  return data || []
}

export const createRoom = async (roomData: Omit<Room, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('rooms')
    .insert(roomData)
    .select()
    .single()

  if (error) {
    console.error('Error creating room:', error)
    throw error
  }

  return data
}

// Booking Operations
export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', userId)
    .order('booking_time', { ascending: false })

  if (error) {
    console.error('Error fetching user bookings:', error)
    throw error
  }

  return data || []
}

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'booking_time' | 'verified'>) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      verified: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    throw error
  }

  return data
}

// Statistics
export const getUserStats = async (userId: string) => {
  const profile = await getUserProfile(userId)
  
  if (!profile) {
    throw new Error('User profile not found')
  }

  let stats = {
    activeListings: 0,
    totalViews: 0,
    applications: 0,
    bookings: 0
  }

  if (profile.role === 'landlord' || (profile.role === 'agent' && profile.agent_status === 'active')) {
    // Get user's pads
    const pads = await getPadsByUser(userId)
    stats.activeListings = pads.length
    stats.totalViews = pads.reduce((total, pad) => total + pad.view_count, 0)

    // Get bookings for user's rooms
    if (pads.length > 0) {
      const padIds = pads.map(pad => pad.id)
      
      // Get all rooms for user's pads
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .in('pad_id', padIds)

      if (rooms && rooms.length > 0) {
        const roomIds = rooms.map(room => room.id)
        
        // Get bookings for these rooms
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, verified')
          .in('room_id', roomIds)

        if (bookings) {
          stats.applications = bookings.length
          stats.bookings = bookings.filter(booking => booking.verified).length
        }
      }
    }
  } else if (profile.role === 'tenant') {
    // Get user's bookings
    const bookings = await getBookingsByUser(userId)
    stats.applications = bookings.length
    stats.bookings = bookings.filter(booking => booking.verified).length
  }

  return stats
}
