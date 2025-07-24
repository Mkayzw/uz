'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { RoomRow, BedRow } from '@/types/database'

/**
 * Adds a new room to a property and returns the inserted room data or an error message.
 *
 * @param propertyId - The ID of the property to which the room will be added
 * @param roomData - The data for the new room, excluding ID, property ID, and timestamps
 * @returns An object containing the inserted room data or an error message if the operation fails
 */
export async function addRoom(propertyId: string, roomData: Omit<RoomRow, 'id' | 'property_id' | 'created_at' | 'updated_at'>) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('rooms')
        .insert({ ...roomData, property_id: propertyId })
        .select()
        .single()

    if (error) {
        console.error('Error adding room:', error)
        return { error: 'Failed to add room.' }
    }

    revalidatePath(`/dashboard/manage-properties/${propertyId}/rooms`)
    return { data }
}

/**
 * Adds a new bed to a room if the room has not reached its capacity.
 *
 * Checks the current number of beds in the specified room and inserts a new bed if capacity allows. Returns the inserted bed data or an error message if the room is full or the operation fails.
 *
 * @param roomId - The unique identifier of the room to add the bed to
 * @param bedData - The data for the new bed, excluding auto-generated fields
 * @returns An object containing the inserted bed data or an error message
 */
export async function addBed(roomId: string, bedData: Omit<BedRow, 'id' | 'room_id' | 'created_at' | 'updated_at'>) {
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

/**
 * Deletes a bed by its ID.
 *
 * @param bedId - The unique identifier of the bed to delete
 * @returns An object indicating success or containing an error message if deletion fails
 */
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

/**
 * Updates the occupancy status of a bed.
 *
 * @param bedId - The unique identifier of the bed to update
 * @param isOccupied - Whether the bed is currently occupied
 * @returns The updated bed data, or an error message if the update fails
 */
export async function updateBedAvailability(bedId: string, isOccupied: boolean) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('beds')
        .update({ is_occupied: isOccupied })
        .eq('id', bedId)
        .select()
        .single()

    if (error) {
        console.error('Error updating bed occupancy:', error)
        return { error: 'Failed to update bed occupancy.' }
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

/**
 * Marks an application's payment as verified.
 *
 * @param applicationId - The ID of the application to update
 * @returns The updated application data, or an error message if the update fails
 */
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
/**
 * Submits a new application for a specific bed on behalf of the authenticated user.
 *
 * Checks for duplicate applications by the user for the same bed and verifies that the bed is not already occupied. Updates the user's profile with provided registration details before creating the application. Optionally includes a message and transaction code. Returns the created application data or an error message if the operation fails.
 *
 * @param bedId - The ID of the bed to apply for
 * @param registrationNumber - The applicant's registration number
 * @param nationalId - The applicant's national ID
 * @param gender - The applicant's gender
 * @param message - Optional message to include with the application
 * @param transactionCode - Optional transaction code for payment verification
 * @returns An object containing the new application data or an error message
 */
export async function submitApplication(
  bedId: string,
  registrationNumber: string,
  nationalId: string,
  gender: string,
  message?: string,
  transactionCode?: string
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to apply.' }
  }

  try {
    // Check if user has already applied for this bed
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('bed_id', bedId)
      .eq('tenant_id', user.id)
      .single()

    if (existingApplication) {
      return { error: 'You have already applied for this bed.' }
    }

    // Check if the bed is still available
    const { data: bed, error: bedError } = await supabase
      .from('beds')
      .select('is_occupied')
      .eq('id', bedId)
      .single()

    if (bedError) {
      console.error('Error checking bed availability:', bedError)
      return { error: 'Failed to verify bed availability.' }
    }

    if (bed.is_occupied) {
      return { error: 'This bed is no longer available.' }
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        registration_number: registrationNumber,
        national_id: nationalId,
        gender: gender
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    // Create application
    const { data, error } = await supabase
      .from('applications')
      .insert({
        bed_id: bedId,
        tenant_id: user.id,
        status: 'pending',
        message: message || null,
        transaction_code: transactionCode || null
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { data }
  } catch (error: any) {
    console.error('Error submitting application:', error)

    // Handle specific database constraint errors
    if (error.code === '23505' && error.message.includes('applications_bed_id_tenant_id_key')) {
      return { error: 'You have already applied for this bed.' }
    }

    return { error: 'Failed to submit application.' }
  }
}

/**
 * Retrieves detailed and summary statistics for all rooms in a property.
 *
 * Calls a stored procedure to fetch room-level statistics, then calculates aggregate metrics such as total rooms, capacity, beds, available and occupied beds, number of full rooms, occupancy rate, and capacity utilization.
 *
 * @param propertyId - The unique identifier of the property to fetch statistics for
 * @returns An object containing detailed room data and summary statistics, or an error message if retrieval fails
 */
export async function getPropertyStats(propertyId: string) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Use the new get_property_stats function
    const { data, error } = await supabase
        .rpc('get_property_stats', { property_uuid: propertyId })

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
