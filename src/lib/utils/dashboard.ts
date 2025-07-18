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
  const { data, error } = await supabase
    .from('applications')
    .select('*, property:pads(*, created_by_profile:profiles(*))')
    .eq('tenant_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  return data?.map(app => ({
    ...app,
    property: app.property ? {
      ...app.property,
      id: app.property.id,
      title: app.property.title,
      location: app.property.location,
      image_url: app.property.image_url,
      view_count: app.property.view_count,
      created_at: app.property.created_at,
      description: app.property.description,
      price: app.property.price,
      bedrooms: app.property.bedrooms,
      bathrooms: app.property.bathrooms,
      image_urls: app.property.image_urls,
      active: app.property.active,
      property_type: app.property.property_type,
      has_internet: app.property.has_internet,
      has_parking: app.property.has_parking,
      has_air_conditioning: app.property.has_air_conditioning,
      is_furnished: app.property.is_furnished
    } : undefined
  })) || []
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