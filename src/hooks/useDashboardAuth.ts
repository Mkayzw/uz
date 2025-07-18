import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'
import { getProfile } from '@/lib/utils/dashboard'

export function useDashboardAuth() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const authCheckInProgress = useRef(false)

  useEffect(() => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) return

    const initializeAuth = async () => {
      authCheckInProgress.current = true

      try {
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          // Only redirect to login if this is the initial load, not browser navigation
          if (!isInitialized) {
            // Store current path for redirect after login
            const currentPath = window.location.pathname + window.location.search
            if (currentPath !== '/dashboard' && !currentPath.startsWith('/auth/')) {
              localStorage.setItem('redirect_after_auth', currentPath)
            }
            router.push('/auth/login')
          }
          return
        }

        setUser(session.user)

        const profileData = await getProfile(supabase, session.user)
        setProfile(profileData)
        setIsInitialized(true)

      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication')

        // Only redirect on actual errors, not network issues
        if (err instanceof Error && err.message.includes('Invalid JWT')) {
          router.push('/auth/login')
        }
      } finally {
        setLoading(false)
        authCheckInProgress.current = false
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setIsInitialized(false)
        router.push('/auth/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const profileData = await getProfile(supabase, session.user)
          setProfile(profileData)
          setIsInitialized(true)
        } catch (err) {
          console.error('Profile fetch error:', err)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, isInitialized])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return {
    user,
    profile,
    loading,
    error,
    displayName,
    handleSignOut
  }
}
