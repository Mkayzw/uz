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

export interface Property {
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

// Property Operations
export const createProperty = async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property | null> => {
  const { data, error } = await supabase
    .from('properties')
    .insert([propertyData])
    .select()
    .single()

  if (error) {
    console.error('Error creating property:', error)
    throw error
  }

  return data
}

export const getPropertiesByOwner = async (ownerId: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    throw error
  }

  return data || []
}

export const getPropertyById = async (propertyId: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (error) {
    console.error('Error fetching property:', error)
    return null
  }

  return data
}

export const updateProperty = async (propertyId: string, updates: Partial<Property>): Promise<Property | null> => {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single()

  if (error) {
    console.error('Error updating property:', error)
    throw error
  }

  return data
}

export const deleteProperty = async (propertyId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)

  if (error) {
    console.error('Error deleting property:', error)
    throw error
  }

  return true
}

// Image Upload Operations
export const uploadPropertyImage = async (file: File, ownerId: string, propertyId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${ownerId}/${propertyId}/${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `properties/${fileName}`

  const { error } = await supabase.storage
    .from('property-images')
    .upload(filePath, file)

  if (error) {
    console.error('Error uploading image:', error)
    throw error
  }

  const { data } = supabase.storage
    .from('property-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export const uploadMultiplePropertyImages = async (files: File[], ownerId: string): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${ownerId}/${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `properties/${fileName}`

    const { error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file)

    if (error) {
      console.error('Error uploading image:', error)
      throw error
    }

    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  })

  return Promise.all(uploadPromises)
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
