import { SupabaseClient, User } from '@supabase/supabase-js'

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

export const getAgentProperties = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('property_room_status')
    .select('*')
    .eq('created_by', userId)

  if (error) {
    console.error('Error fetching properties:', error)
    throw new Error('Failed to load your properties')
  }

  // Transform the data to match the Property interface
  return data?.map(prop => ({
    id: prop.property_id,
    title: prop.title,
    description: prop.description,
    location: prop.location,
    city: prop.city,
    state: prop.state,
    zip_code: prop.zip_code,
    property_type: prop.property_type,
    price: prop.price,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    image_url: prop.image_url,
    image_urls: prop.image_urls,
    has_internet: prop.has_internet,
    has_parking: prop.has_parking,
    has_air_conditioning: prop.has_air_conditioning,
    is_furnished: prop.is_furnished,
    has_pool: prop.has_pool,
    has_power: prop.has_power,
    has_water: prop.has_water,
    has_tv: prop.has_tv,
    has_laundry: prop.has_laundry,
    has_security_system: prop.has_security_system,
    view_count: prop.view_count,
    created_at: prop.created_at,
    active: prop.active,
    total_rooms: prop.total_rooms,
    full_rooms: prop.full_rooms,
    available_rooms: prop.available_rooms,
    total_beds: prop.total_beds,
    available_beds: prop.available_beds,
    occupancy_rate: prop.occupancy_rate
  })) || []
}

export const getAllActiveProperties = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
        .from('property_room_status')
        .select('*')
        .eq('active', true)
        .order('property_id', { ascending: false })

    if (error) {
        console.error('Error fetching all properties:', error)
        return []
    }

    // Transform the data to match the Property interface
    return data?.map(prop => ({
        id: prop.property_id,
        title: prop.title,
        description: prop.description,
        location: prop.location,
        city: prop.city,
        state: prop.state,
        zip_code: prop.zip_code,
        property_type: prop.property_type,
        price: prop.price,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        image_url: prop.image_url,
        image_urls: prop.image_urls,
        has_internet: prop.has_internet,
        has_parking: prop.has_parking,
        has_air_conditioning: prop.has_air_conditioning,
        is_furnished: prop.is_furnished,
        has_pool: prop.has_pool,
        has_power: prop.has_power,
        has_water: prop.has_water,
        has_tv: prop.has_tv,
        has_laundry: prop.has_laundry,
        has_security_system: prop.has_security_system,
        view_count: prop.view_count,
        created_at: prop.created_at,
        created_by: prop.created_by,
        active: prop.active,
        total_rooms: prop.total_rooms,
        full_rooms: prop.full_rooms,
        available_rooms: prop.available_rooms,
        total_beds: prop.total_beds,
        available_beds: prop.available_beds,
        occupancy_rate: prop.occupancy_rate
    })) || []
}


export const getTenantApplications = async (supabase: SupabaseClient, userId: string) => {
  try {
    // Add small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))

    // Skip RPC function for now and go directly to fallback
    console.log('Skipping RPC function, using direct query approach for user:', userId)

    // Use direct query approach with comprehensive property data
    const { data: directData, error: directError } = await supabase
      .from('applications')
      .select(`
        *,
        property:pads(
          id,
          title,
          location,
          image_url,
          image_urls,
          price,
          bedrooms,
          bathrooms,
          property_type,
          has_internet,
          has_parking,
          has_air_conditioning,
          is_furnished,
          active,
          view_count,
          created_at,
          description
        )
      `)
      .eq('tenant_id', userId)
      .order('created_at', { ascending: false })

    if (directError) {
      console.error('Direct query failed:', {
        error: directError,
        message: directError.message,
        details: directError.details,
        hint: directError.hint,
        code: directError.code,
        userId: userId
      })

      // Final fallback: just get applications without property data
      const { data: simpleData, error: simpleError } = await supabase
        .from('applications')
        .select('*')
        .eq('tenant_id', userId)
        .order('created_at', { ascending: false })

      if (simpleError) {
        console.error('Simple fallback also failed:', simpleError)
        return []
      }

      return simpleData?.map(app => ({ ...app, property: undefined })) || []
    }

    // Return the direct query result
    console.log('Direct query successful, returning data for user:', userId, 'Data count:', directData?.length)
    console.log('Sample data:', directData?.[0])
    return directData || []

  } catch (err) {
    console.error('Error in getTenantApplications:', err)
    return []
  }
}

export const getSavedProperties = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('saved_properties')
    .select('*, property:pads(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved properties:', error)
    return []
  }

  return data?.map(saved => ({
    ...saved,
    property: saved.property ? {
      ...saved.property,
      id: saved.property.id,
      title: saved.property.title,
      location: saved.property.location,
      image_url: saved.property.image_url,
      view_count: saved.property.view_count,
      created_at: saved.property.created_at,
      description: saved.property.description,
      price: saved.property.price,
      bedrooms: saved.property.bedrooms,
      bathrooms: saved.property.bathrooms,
      image_urls: saved.property.image_urls,
      active: saved.property.active,
      property_type: saved.property.property_type,
      has_internet: saved.property.has_internet,
      has_parking: saved.property.has_parking,
      has_air_conditioning: saved.property.has_air_conditioning,
      is_furnished: saved.property.is_furnished
    } : undefined
  })) || []
}

export const getAgentApplications = async (supabase: SupabaseClient, userId: string) => {
  const { data: agentPads, error: padsError } = await supabase
    .from('pads')
    .select('id')
    .eq('created_by', userId)

  if (padsError) {
    console.error('Error fetching agent properties:', padsError)
    return []
  }

  const propertyIds = agentPads.map(p => p.id)

  if (propertyIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      property:pads(*),
      tenant:profiles!applications_tenant_id_fkey(*),
      bed:beds(*)
    `)
    .in('property_id', propertyIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching agent applications:', error)
    return []
  }

  return data || []
}