'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

type State = {
  success: boolean;
  error?: string;
};

export async function approvePayment(prevState: State, formData: FormData): Promise<State> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const paymentId = formData.get('payment_id') as string;
  const agentId = formData.get('agent_id') as string;

  if (!paymentId || !agentId) {
    return { success: false, error: 'Payment ID or Agent ID not provided.' };
  }

  // In a real app, you would check a custom claim or a 'roles' table.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be logged in to perform this action.' };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return { success: false, error: 'You are not authorized to perform this action.' };
  }

  // Step 1: Update the agent_payments table
  const { error: paymentError } = await supabase
    .from('agent_payments')
    .update({ verified: true })
    .eq('id', paymentId);

  if (paymentError) {
    return { success: false, error: `Error updating payment status: ${paymentError.message}` };
  }

  // Step 2: Update the profiles table to mark agent as verified
  const { error: agentProfileError } = await supabase
    .from('profiles')
    .update({ is_verified_agent: true, agent_status: 'active' })
    .eq('id', agentId);

  if (agentProfileError) {
    // If this fails, we should ideally roll back the payment verification
    return { success: false, error: `Error updating agent profile: ${agentProfileError.message}` };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function verifyAgentAction(agentId: string): Promise<State> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to perform this action.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return { success: false, error: 'You are not authorized to perform this action.' };
  }

  const { error: agentProfileError } = await supabase
    .from('profiles')
    .update({ is_verified_agent: true, agent_status: 'active' })
    .eq('id', agentId);

  if (agentProfileError) {
    return { success: false, error: `Error updating agent profile: ${agentProfileError.message}` };
  }

  revalidatePath('/admin');
  return { success: true };
}
