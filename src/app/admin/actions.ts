'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function verifyAgentAction(agentId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Optional: Add another check here to ensure the current user is an admin before proceeding.

  const { error } = await supabase
    .from('profiles')
    .update({ is_verified_agent: true })
    .eq('id', agentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin'); // Tells Next.js to refresh the data on the admin page
  return { error: null };
}
