import { SupabaseClient, User } from '@supabase/supabase-js'
import { PropertyAmenities } from '@/types/database'

export const getProfile = async (supabase: SupabaseClient, user: User) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    throw new Error('Failed to load user profile')
  }

  return data
}

// Helper function to extract amenities
const extractAmenities = (amenities: any) => {
  const amenitiesObj = amenities as PropertyAmenities || {}
  return {
    has_internet: amenitiesObj.utilities?.internet || false,
    has_power: amenitiesObj.utilities?.power || false,
    has_water: amenitiesObj.utilities?.water || false,
    has_pool: amenitiesObj.facilities?.pool || false,
    has_parking: amenitiesObj.facilities?.parking || false,
    has_laundry: amenitiesObj.facilities?.laundry || false,
    has_security_system: amenitiesObj.facilities?.security_system || false,
    has_air_conditioning: amenitiesObj.room_features?.air_conditioning || false,
    has_tv: amenitiesObj.room_features?.tv || false,
    is_furnished: amenitiesObj.room_features?.furnished || false,
  }
}

export const getAgentProperties = async (supabase: SupabaseClient, userId: string) => {
  // First get properties with their stats
  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select(`
      *,
      rooms(
        id,
        name,
        room_type,
        price_per_bed,
        capacity,
        bathrooms,
        is_available,
        beds(id, is_occupied)
      )
    `)
    .eq('owner_id', userId)
    .eq('status', 'published')

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError)
    throw new Error('Failed to load your properties')
  }

  // Transform the data to match the expected Property interface
  return propertiesData?.map(prop => {
    const amenities = extractAmenities(prop.amenities)
    const totalRooms = prop.rooms?.length || 0
    const totalBeds = prop.rooms?.reduce((sum: number, room: any) => sum + (room.beds?.length || 0), 0) || 0
    const occupiedBeds = prop.rooms?.reduce((sum: number, room: any) =>
      sum + (room.beds?.filter((bed: any) => bed.is_occupied).length || 0), 0) || 0
    const availableBeds = totalBeds - occupiedBeds
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    const minPrice = prop.rooms?.reduce((min: number, room: any) =>
      Math.min(min, room.price_per_bed), Infinity) || 0

    return {
      id: prop.id,
      title: prop.title,
      description: prop.description,
      location: prop.address, // Map address to location for backward compatibility
      city: prop.city,
      state: prop.state,
      zip_code: prop.zip_code,
      property_type: prop.property_type,
      price: minPrice, // Use minimum room price as property price
      bedrooms: totalRooms, // Use total rooms as bedrooms for backward compatibility
      bathrooms: prop.rooms?.reduce((sum: number, room: any) => sum + (room.bathrooms || 0), 0) || 0,
      image_url: prop.images?.[0] || null, // First image as primary
      image_urls: prop.images || [],
      ...amenities,
      view_count: prop.view_count,
      created_at: prop.created_at,
      active: prop.status === 'published',
      total_rooms: totalRooms,
      full_rooms: totalRooms - Math.ceil(availableBeds / 4), // Estimate full rooms
      available_rooms: Math.ceil(availableBeds / 4), // Estimate available rooms
      total_beds: totalBeds,
      available_beds: availableBeds,
      occupancy_rate: occupancyRate
    }
  }) || []
}

export const getAllActiveProperties = async (supabase: SupabaseClient) => {
  // Get all published properties with their room and bed data
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      rooms(
        id,
        name,
        room_type,
        price_per_bed,
        capacity,
        bathrooms,
        is_available,
        beds(id, is_occupied)
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all properties:', error)
    return []
  }

  // Transform the data to match the expected Property interface
  return data?.map(prop => {
    const amenities = extractAmenities(prop.amenities)
    const totalRooms = prop.rooms?.length || 0
    const totalBeds = prop.rooms?.reduce((sum: number, room: any) => sum + (room.beds?.length || 0), 0) || 0
    const occupiedBeds = prop.rooms?.reduce((sum: number, room: any) =>
      sum + (room.beds?.filter((bed: any) => bed.is_occupied).length || 0), 0) || 0
    const availableBeds = totalBeds - occupiedBeds
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    const minPrice = prop.rooms?.reduce((min: number, room: any) =>
      Math.min(min, room.price_per_bed), Infinity) || 0

    return {
      id: prop.id,
      title: prop.title,
      description: prop.description,
      location: prop.address, // Map address to location for backward compatibility
      city: prop.city,
      state: prop.state,
      zip_code: prop.zip_code,
      property_type: prop.property_type,
      price: minPrice, // Use minimum room price as property price
      bedrooms: totalRooms, // Use total rooms as bedrooms for backward compatibility
      bathrooms: prop.rooms?.reduce((sum: number, room: any) => sum + (room.bathrooms || 0), 0) || 0,
      image_url: prop.images?.[0] || null, // First image as primary
      image_urls: prop.images || [],
      ...amenities,
      view_count: prop.view_count,
      created_at: prop.created_at,
      created_by: prop.owner_id, // Map owner_id to created_by for backward compatibility
      active: prop.status === 'published',
      total_rooms: totalRooms,
      full_rooms: totalRooms - Math.ceil(availableBeds / 4), // Estimate full rooms
      available_rooms: Math.ceil(availableBeds / 4), // Estimate available rooms
      total_beds: totalBeds,
      available_beds: availableBeds,
      occupancy_rate: occupancyRate
    }
  }) || []
}


export const getTenantApplications = async (supabase: SupabaseClient, userId: string) => {
  try {
    // Add small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))

    console.log('Fetching tenant applications for user:', userId)

    // Use the new application_details view for comprehensive data
    const { data: directData, error: directError } = await supabase
      .from('application_details')
      .select('*')
      .eq('tenant_id', userId)
      .order('created_at', { ascending: false })

    if (directError) {
      console.error('Application details query failed:', {
        error: directError,
        message: directError.message,
        details: directError.details,
        hint: directError.hint,
        code: directError.code,
        userId: userId
      })

      // Fallback: get applications with manual joins
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('applications')
        .select(`
          *,
          bed:beds(
            id,
            bed_number,
            room:rooms(
              id,
              name,
              room_type,
              price_per_bed,
              property:properties(
                id,
                title,
                description,
                address,
                city,
                images,
                amenities,
                view_count,
                created_at
              )
            )
          )
        `)
        .eq('tenant_id', userId)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        return []
      }

      // Transform fallback data to match expected format
      return fallbackData?.map(app => ({
        ...app,
        property: app.bed?.room?.property ? {
          id: app.bed.room.property.id,
          title: app.bed.room.property.title,
          description: app.bed.room.property.description,
          location: app.bed.room.property.address,
          image_url: app.bed.room.property.images?.[0] || null,
          image_urls: app.bed.room.property.images || [],
          price: app.bed.room.price_per_bed,
          view_count: app.bed.room.property.view_count,
          created_at: app.bed.room.property.created_at,
          active: true, // Assume published properties are active
          ...extractAmenities(app.bed.room.property.amenities)
        } : undefined
      })) || []
    }

    // Transform application_details view data to match expected format
    return directData?.map(app => ({
      id: app.id,
      bed_id: app.bed_id,
      tenant_id: app.tenant_id,
      status: app.status,
      message: app.message,
      transaction_code: app.transaction_code,
      payment_verified: app.payment_verified,
      created_at: app.created_at,
      updated_at: app.updated_at,
      property: {
        id: app.bed_id,
        title: app.property_title,
        description: null, // Not available in view
        location: app.address,
        image_url: null, // Not available in view
        image_urls: [],
        price: app.price_per_bed,
        bedrooms: null,
        bathrooms: null,
        property_type: null,
        view_count: 0,
        created_at: app.created_at,
        active: true,
        // Default amenities since not available in view
        has_internet: false,
        has_parking: false,
        has_air_conditioning: false,
        is_furnished: false,
        has_pool: false,
        has_power: false,
        has_water: false,
        has_tv: false,
        has_laundry: false,
        has_security_system: false
      }
    })) || []

  } catch (err) {
    console.error('Error in getTenantApplications:', err)
    return []
  }
}

export const getSavedProperties = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('saved_properties')
    .select(`
      *,
      property:properties(
        *,
        rooms(
          id,
          name,
          room_type,
          price_per_bed,
          capacity,
          bathrooms,
          is_available,
          beds(id, is_occupied)
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved properties:', error)
    return []
  }

  return data?.map(saved => ({
    ...saved,
    property: saved.property ? {
      id: saved.property.id,
      title: saved.property.title,
      description: saved.property.description,
      location: saved.property.address, // Map address to location
      city: saved.property.city,
      state: saved.property.state,
      zip_code: saved.property.zip_code,
      property_type: saved.property.property_type,
      image_url: saved.property.images?.[0] || null,
      image_urls: saved.property.images || [],
      view_count: saved.property.view_count,
      created_at: saved.property.created_at,
      active: saved.property.status === 'published',
      // Calculate price from rooms
      price: saved.property.rooms?.reduce((min: number, room: any) =>
        Math.min(min, room.price_per_bed), Infinity) || 0,
      // Calculate bedrooms and bathrooms from rooms
      bedrooms: saved.property.rooms?.length || 0,
      bathrooms: saved.property.rooms?.reduce((sum: number, room: any) => sum + (room.bathrooms || 0), 0) || 0,
      // Extract amenities
      ...extractAmenities(saved.property.amenities)
    } : undefined
  })) || []
}

export const getAgentApplications = async (supabase: SupabaseClient, userId: string) => {
  // First get agent's properties
  const { data: agentProperties, error: propertiesError } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId)

  if (propertiesError) {
    console.error('Error fetching agent properties:', propertiesError)
    return []
  }

  const propertyIds = agentProperties.map(p => p.id)

  if (propertyIds.length === 0) {
    return []
  }

  // Get applications for agent's properties using the application_details view
  const { data, error } = await supabase
    .from('application_details')
    .select('*')
    .in('bed_id', propertyIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching agent applications:', error)

    // Fallback: manual join query
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('applications')
      .select(`
        *,
        bed:beds(
          id,
          bed_number,
          room:rooms(
            id,
            name,
            room_type,
            price_per_bed,
            property:properties(
              id,
              title,
              address,
              city,
              images
            )
          )
        ),
        tenant:profiles(*)
      `)
      .in('bed_id', []) // We need to get bed_ids first

    if (fallbackError) {
      console.error('Fallback query also failed:', fallbackError)
      return []
    }

    return fallbackData || []
  }

  // Transform application_details view data to match expected format
  return data?.map(app => ({
    id: app.id,
    bed_id: app.bed_id,
    tenant_id: app.tenant_id,
    status: app.status,
    message: app.message,
    transaction_code: app.transaction_code,
    payment_verified: app.payment_verified,
    created_at: app.created_at,
    updated_at: app.updated_at,
    property: {
      id: app.bed_id,
      title: app.property_title,
      address: app.address,
      city: app.city
    },
    tenant: {
      id: app.tenant_id,
      full_name: app.tenant_name,
      registration_number: app.registration_number,
      national_id: app.national_id,
      ecocash_number: app.tenant_ecocash
    },
    bed: {
      id: app.bed_id,
      bed_number: app.bed_number,
      room: {
        id: app.room_id,
        name: app.room_name,
        room_type: app.room_type,
        price_per_bed: app.price_per_bed
      }
    }
  })) || []
}