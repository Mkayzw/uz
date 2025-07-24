import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Fetch published properties with room data for pricing
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        description,
        address,
        city,
        state,
        property_type,
        amenities,
        images,
        view_count,
        created_at,
        rooms(
          id,
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
      .limit(12)

    if (error) {
      console.error('Error fetching properties:', error)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    // Transform properties to match expected format
    const transformedProperties = properties?.map(prop => {
      const amenities = (prop.amenities as PropertyAmenities) || {}
      const totalRooms = prop.rooms?.length || 0
      const totalBeds = prop.rooms?.reduce((sum: number, room: any) => sum + (room.beds?.length || 0), 0) || 0
      const occupiedBeds = prop.rooms?.reduce((sum: number, room: any) =>
        sum + (room.beds?.filter((bed: any) => bed.is_occupied).length || 0), 0) || 0
      const availableBeds = totalBeds - occupiedBeds
      const minPrice = prop.rooms?.reduce((min: number, room: any) =>
        Math.min(min, room.price_per_bed), Infinity) || 0

      return {
        id: prop.id,
        title: prop.title,
        description: prop.description,
        location: prop.address, // Map address to location for backward compatibility
        city: prop.city,
        state: prop.state,
        property_type: prop.property_type,
        price: minPrice,
        bedrooms: totalRooms,
        bathrooms: prop.rooms?.reduce((sum: number, room: any) => sum + (room.bathrooms || 0), 0) || 0,
        image_url: prop.images?.[0] || null,
        image_urls: prop.images || [],
        // Extract amenities
        has_internet: amenities.utilities?.internet || false,
        has_parking: amenities.facilities?.parking || false,
        has_air_conditioning: amenities.room_features?.air_conditioning || false,
        is_furnished: amenities.room_features?.furnished || false,
        has_pool: amenities.facilities?.pool || false,
        has_power: amenities.utilities?.power || false,
        has_water: amenities.utilities?.water || false,
        has_tv: amenities.room_features?.tv || false,
        has_laundry: amenities.facilities?.laundry || false,
        has_security_system: amenities.facilities?.security_system || false,
        view_count: prop.view_count,
        created_at: prop.created_at,
        // Additional stats
        total_beds: totalBeds,
        available_beds: availableBeds,
        occupancy_rate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      }
    }) || []

    return NextResponse.json({ properties: transformedProperties })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
