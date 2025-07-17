import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${request.headers.get('origin')}/auth/confirm`,
  });

  if (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Password reset link sent' });
}