import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Get session for route protection
  const { data: { session } } = await supabase.auth.getSession()

  // Handle dashboard routes - minimal session management only
  if (pathname.startsWith('/dashboard')) {
    // Let the client-side DashboardRouter handle all authentication logic
    // Middleware only ensures session cookies are properly maintained
    return response
  }

  // Handle admin routes - protect at middleware level
  if (pathname.startsWith('/admin')) {
    if (!session) {
      // No session - redirect to login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user has admin role
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        // Not an admin - redirect to home page
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      console.error('Error checking admin role in middleware:', error)
      // On error, redirect to home page for security
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  }

  // Handle auth routes - let client-side handle redirects to avoid conflicts
  if (pathname.startsWith('/auth/')) {
    // Don't redirect here - let the auth pages handle their own logic
    // This prevents conflicts with the dashboard authentication flow
    return response
  }

  // For all other routes, just ensure session is properly maintained
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
