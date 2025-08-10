import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'
  const selectedRole = searchParams.get('role') as 'tenant' | 'agent' | 'admin' | null

  // If provider forwarded an error, bubble it to the error page for debugging
  const providerError = searchParams.get('error')
  const providerErrorDesc = searchParams.get('error_description')
  if (providerError || providerErrorDesc) {
    const q = new URLSearchParams()
    if (providerError) q.set('error', providerError)
    if (providerErrorDesc) q.set('desc', providerErrorDesc)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?${q.toString()}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const q = new URLSearchParams({ reason: 'exchange_failed', message: error.message || 'Unknown error' })
      return NextResponse.redirect(`${origin}/auth/auth-code-error?${q.toString()}`)
    }

    // For login: don't create/modify profiles, just redirect
    // For signup: we'll handle profile creation in a separate step
    // This avoids "Database error saving new user" during OAuth exchange

    const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=missing_code`)
}
