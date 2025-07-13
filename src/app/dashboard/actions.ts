
'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateApplicationStatus(applicationId: string, status: 'approved' | 'rejected') {
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
