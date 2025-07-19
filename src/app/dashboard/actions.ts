'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { RoomRow, BedRow } from '@/types/database'

export async function addRoom(padId: string, roomData: Omit<RoomRow, 'id' | 'pad_id' | 'created_at'>) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('rooms')
        .insert({ ...roomData, pad_id: padId })
        .select()
        .single()

    if (error) {
        console.error('Error adding room:', error)
        return { error: 'Failed to add room.' }
    }

    revalidatePath(`/dashboard/manage-properties/${padId}/rooms`)
    return { data }
}

export async function addBed(roomId: string, bedData: Omit<BedRow, 'id' | 'room_id'>) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // First check if the room has capacity for more beds
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('capacity, beds:beds(count)')
        .eq('id', roomId)
        .single()

    if (roomError) {
        console.error('Error fetching room:', roomError)
        return { error: 'Failed to verify room capacity.' }
    }

    const currentBedCount = room.beds[0]?.count || 0
    if (currentBedCount >= room.capacity) {
        return { error: 'Room has reached maximum capacity.' }
    }

    const { data, error } = await supabase
        .from('beds')
        .insert({ ...bedData, room_id: roomId })
        .select()
        .single()

    if (error) {
        console.error('Error adding bed:', error)
        return { error: 'Failed to add bed.' }
    }

    revalidatePath(`/dashboard/manage-properties/*/rooms`)
    return { data }
}

export async function deleteBed(bedId: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
        .from('beds')
        .delete()
        .eq('id', bedId)

    if (error) {
        console.error('Error deleting bed:', error)
        return { error: 'Failed to delete bed.' }
    }

    revalidatePath(`/dashboard/manage-properties/*/rooms`)
    return { success: true }
}

export async function updateBedAvailability(bedId: string, isAvailable: boolean) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('beds')
        .update({ is_available: isAvailable })
        .eq('id', bedId)
        .select()
        .single()

    if (error) {
        console.error('Error updating bed availability:', error)
        return { error: 'Failed to update bed availability.' }
    }

    revalidatePath(`/dashboard/manage-properties/*/rooms`)
    return { data }
}

export async function deleteRoom(roomId: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // First delete all beds in the room
    const { error: bedsError } = await supabase
        .from('beds')
        .delete()
        .eq('room_id', roomId)

    if (bedsError) {
        console.error('Error deleting beds:', bedsError)
        return { error: 'Failed to delete room beds.' }
    }

    // Then delete the room
    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)

    if (error) {
        console.error('Error deleting room:', error)
        return { error: 'Failed to delete room.' }
    }

    revalidatePath(`/dashboard/manage-properties/*/rooms`)
    return { success: true }
}

export async function updateApplicationStatus(applicationId: string, status: 'approved' | 'rejected' | 'cancelled') {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating application status:', error)
    return { error: 'Failed to update application status.' }
  }

  revalidatePath('/dashboard')
  return { data }
}
export async function cancelApplication(applicationId: string) {
  return updateApplicationStatus(applicationId, 'cancelled')
}

export async function verifyPayment(applicationId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('applications')
    .update({ payment_verified: true })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) {
    console.error('Error verifying payment:', error)
    return { error: 'Failed to verify payment.' }
  }

  revalidatePath('/dashboard')
  return { data }
}
export async function submitApplication(
  propertyId: string,
  bedId: string,
  registrationNumber: string,
  nationalId: string
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to apply.' }
  }

  try {
    // Check if user has already applied to this property
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('property_id', propertyId)
      .eq('tenant_id', user.id)
      .single()

    if (existingApplication) {
      return { error: 'You have already applied to this property.' }
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ registration_number: registrationNumber, national_id: nationalId })
      .eq('id', user.id)

    if (profileError) throw profileError

    // Create application
    const { data, error } = await supabase
      .from('applications')
      .insert({
        property_id: propertyId,
        tenant_id: user.id,
        bed_id: bedId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { data }
  } catch (error: any) {
    console.error('Error submitting application:', error)

    // Handle specific database constraint errors
    if (error.code === '23505' && error.message.includes('applications_property_id_tenant_id_key')) {
      return { error: 'You have already applied to this property.' }
    }

    return { error: 'Failed to submit application.' }
  }
}

export async function getRoomStats(padId: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('room_occupancy_stats')
        .select('*')
        .eq('pad_id', padId)

    if (error) {
        console.error('Error fetching room stats:', error)
        return { error: 'Failed to fetch room statistics.' }
    }

    // Calculate summary statistics
    const totalRooms = data.length
    const totalCapacity = data.reduce((sum, room) => sum + room.capacity, 0)
    const totalBeds = data.reduce((sum, room) => sum + room.total_beds, 0)
    const availableBeds = data.reduce((sum, room) => sum + room.available_beds, 0)
    const occupiedBeds = data.reduce((sum, room) => sum + room.occupied_beds, 0)
    const fullRooms = data.filter(room => room.total_beds > 0 && room.available_beds === 0).length
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0
    const capacityUtilization = totalCapacity > 0 ? (totalBeds / totalCapacity) * 100 : 0

    return {
        data,
        summary: {
            totalRooms,
            totalCapacity,
            totalBeds,
            availableBeds,
            occupiedBeds,
            fullRooms,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            capacityUtilization: Math.round(capacityUtilization * 100) / 100
        }
    }
}
