'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'agent'
  agent_status: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
}

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: ('tenant' | 'agent')[]
  requiresActiveAgent?: boolean
}

export default function AuthGuard({
  children,
  allowedRoles,
  requiresActiveAgent = false
}: AuthGuardProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        // Use getSession instead of getUser for better reliability during navigation
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setAuthError('Session error')
          return
        }

        if (!session?.user) {
          // Store current path for redirect after login
          const currentPath = window.location.pathname + window.location.search
          if (currentPath !== '/dashboard' && !currentPath.startsWith('/auth/')) {
            localStorage.setItem('redirect_after_auth', currentPath)
          }

          if (isMounted) {
            router.push('/auth/login')
          }
          return
        }

        // Get user profile - single attempt, no retry to avoid rate limiting
        try {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single<UserProfile>()

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // Profile doesn't exist, redirect to login
              if (isMounted) {
                router.push('/auth/login')
              }
              return
            }
            throw profileError
          }

          const userProfile = data

          if (!userProfile || !isMounted) return

          // Check role permissions
          if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
            router.push('/dashboard')
            return
          }

          // Check agent status if required
          if (requiresActiveAgent && userProfile.role === 'agent' && userProfile.agent_status !== 'active') {
            router.push('/dashboard')
            return
          }

          if (isMounted) {
            setAuthorized(true)
            setAuthError(null)
          }
        } catch (err) {
          console.error('Profile fetch error:', err)
          if (isMounted) {
            setAuthError('Failed to load profile')
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (isMounted) {
          setAuthError('Authentication failed')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, allowedRoles, requiresActiveAgent])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Authentication Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {authError}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-yellow-500 text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don&apos;t have permission to access this page.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
