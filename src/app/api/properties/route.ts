import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Fetch published properties without requiring authentication
    const { data: properties, error } = await supabase
      .from('pads')
      .select(`
        id,
        title,
        description,
        location,
        price,
        bedrooms,
        bathrooms,
        property_type,
        image_url,
        image_urls,
        has_internet,
        has_parking,
        has_air_conditioning,
        is_furnished,
        has_pool,
        has_power,
        has_water,
        has_tv,
        has_laundry,
        has_security_system,
        view_count,
        created_at
      `)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching properties:', error)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    return NextResponse.json({ properties: properties || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
