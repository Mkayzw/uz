import { SupabaseClient, User } from '@supabase/supabase-js'
import { PropertyAmenities } from '@/types/database'

export const getProfile = async (supabase: SupabaseClient, user: User) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    // If profile doesn't exist, create one
    if (error.code === 'PGRST116') {
      console.log('Creating new profile for user:', user.id)
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          full_name: user.user_metadata?.full_name || null,
          role: 'tenant' as const,
          agent_status: 'not_applicable' as const
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        throw new Error('Failed to create user profile')
      }

      return newProfile
    }
    
    console.error('Error fetching profile:', error)
    throw new Error('Failed to load user profile')
  }

  return data
}

// Helper function to extract amenities
export const extractAmenities = (amenities: any) => {
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
      tenant: {
        id: app.tenant_id,
        full_name: app.tenant_name,
        ecocash_number: app.tenant_ecocash,
        registration_number: app.registration_number,
        national_id: app.national_id,
      },
      bed: {
        id: app.bed_id,
        bed_number: app.bed_number,
        room: {
          id: app.room_id,
          name: app.room_name,
          price_per_bed: app.price_per_bed,
          property: {
            id: app.property_id,
            title: app.property_title,
            address: app.address,
            owner: {
              id: app.property_owner_id,
              full_name: app.agent_name,
              ecocash_number: app.agent_ecocash,
            }
          }
        }
      },
      property: {
        id: app.property_id,
        title: app.property_title,
        description: null, // Not available in view
        location: app.address,
        address: app.address,
        image_url: null, // Not available in view
        image_urls: [],
        price: app.price_per_bed,
        bedrooms: null,
        bathrooms: null,
        property_type: null,
        view_count: 0,
        created_at: app.created_at,
        active: true,
        owner: {
          id: app.property_owner_id,
          full_name: app.agent_name,
          ecocash_number: app.agent_ecocash,
          phone_number: app.agent_contact,
        },
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
  console.log('Fetching agent applications for user:', userId)

  // First get agent's properties
  const { data: agentProperties, error: propertiesError } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId)

  if (propertiesError) {
    console.error('Error fetching agent properties:', propertiesError)
    return []
  }

  console.log('Agent properties found:', agentProperties?.length || 0)
  const propertyIds = agentProperties?.map(p => p.id) || []

  if (propertyIds.length === 0) {
    console.log('No properties found for agent')
    return []
  }

  // Get bed IDs that belong to the agent's properties
  // First get rooms for the properties
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id')
    .in('property_id', propertyIds)

  if (roomsError) {
    console.error('Error fetching rooms for agent properties:', {
      error: roomsError,
      message: roomsError.message,
      propertyIds: propertyIds
    })
    return []
  }

  const roomIds = rooms?.map(room => room.id) || []

  // Then get beds for those rooms
  const { data: beds, error: bedsError } = await supabase
    .from('beds')
    .select('id')
    .in('room_id', roomIds)
  if (bedsError) {
    console.error('Error fetching beds for agent properties:', {
      error: bedsError,
      message: bedsError.message,
      details: bedsError.details,
      hint: bedsError.hint,
      code: bedsError.code,
      propertyIds: propertyIds
    })
    return []
  }

  const bedIds = beds?.map(bed => bed.id) || []
  console.log('Bed IDs found for agent properties:', {
    bedCount: bedIds.length,
    propertyCount: propertyIds.length,
    bedIds: bedIds.slice(0, 5), // Log first 5 bed IDs for debugging
    propertyIds: propertyIds
  })

  if (bedIds.length === 0) {
    console.log('No beds found for agent properties')
    return []
  }

  // Get applications for agent's properties using the application_details view
  const { data, error } = await supabase
    .from('application_details')
    .select('*')
    .in('bed_id', bedIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching agent applications:', {
      error: error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      bedIds: bedIds.slice(0, 5), // Log first 5 bed IDs for debugging
      bedCount: bedIds.length
    })

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
      .in('bed_id', bedIds)

    if (fallbackError) {
      console.error('Fallback query also failed:', fallbackError)
      return []
    }

    console.log('Fallback query returned applications:', fallbackData?.length || 0)
    return fallbackData || []
  }

  console.log('Applications found for agent:', data?.length || 0)

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

// Diagnostic function to help troubleshoot application detection issues
export const diagnoseApplicationDetection = async (supabase: SupabaseClient, userId: string) => {
  console.log('🔍 Starting application detection diagnosis for user:', userId)

  try {
    // Check if user exists and get their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
      return { success: false, error: 'Profile not found' }
    }

    console.log('✅ Profile found:', { role: profile.role, agent_status: profile.agent_status })

    if (profile.role !== 'agent') {
      console.log('ℹ️ User is not an agent, skipping agent-specific checks')
      return { success: true, message: 'User is not an agent' }
    }

    // Check agent's properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, status')
      .eq('owner_id', userId)

    if (propertiesError) {
      console.error('❌ Properties fetch error:', propertiesError)
      return { success: false, error: 'Failed to fetch properties' }
    }

    console.log('🏠 Properties found:', properties?.length || 0)
    properties?.forEach(prop => {
      console.log(`  - ${prop.title} (${prop.status})`)
    })

    if (!properties || properties.length === 0) {
      console.log('ℹ️ No properties found for agent')
      return { success: true, message: 'No properties found' }
    }

    // Check rooms for each property
    const propertyIds = properties.map(p => p.id)
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, property_id')
      .in('property_id', propertyIds)

    if (roomsError) {
      console.error('❌ Rooms fetch error:', roomsError)
      return { success: false, error: 'Failed to fetch rooms' }
    }

    console.log('🛏️ Rooms found:', rooms?.length || 0)

    // Check beds for each room
    const roomIds = rooms?.map(r => r.id) || []
    const { data: beds, error: bedsError } = await supabase
      .from('beds')
      .select('id, bed_number, room_id')
      .in('room_id', roomIds)

    if (bedsError) {
      console.error('❌ Beds fetch error:', bedsError)
      return { success: false, error: 'Failed to fetch beds' }
    }

    console.log('🛏️ Beds found:', beds?.length || 0)

    // Check applications for these beds
    const bedIds = beds?.map(b => b.id) || []
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('id, status, bed_id, tenant_id')
      .in('bed_id', bedIds)

    if (applicationsError) {
      console.error('❌ Applications fetch error:', applicationsError)
      return { success: false, error: 'Failed to fetch applications' }
    }

    console.log('📝 Applications found:', applications?.length || 0)
    applications?.forEach(app => {
      console.log(`  - Application ${app.id} (${app.status}) for bed ${app.bed_id}`)
    })

    return {
      success: true,
      data: {
        profile,
        properties: properties?.length || 0,
        rooms: rooms?.length || 0,
        beds: beds?.length || 0,
        applications: applications?.length || 0
      }
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
    return { success: false, error: 'Diagnosis failed' }
  }
}