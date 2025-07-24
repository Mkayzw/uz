import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'
import { getProfile } from '@/lib/utils/dashboard'
import { useSupabaseClient } from './useSupabaseClient'

export function useDashboardAuth() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const initializeOnce = useRef(false)

  useEffect(() => {
    // Only initialize once to prevent session loss on navigation
    if (initializeOnce.current) {
      setLoading(false)
      return
    }

    const initializeAuth = async () => {
      initializeOnce.current = true

      try {
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          // Store current path for redirect after login
          const currentPath = window.location.pathname + window.location.search
          if (currentPath !== '/dashboard' && !currentPath.startsWith('/auth/')) {
            localStorage.setItem('redirect_after_auth', currentPath)
          }
          setLoading(false)
          router.push('/auth/login')
          return
        }

        setUser(session.user)

        const profileData = await getProfile(supabase, session.user)
        setProfile(profileData)

      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication')

        // Only redirect on actual errors, not network issues
        if (err instanceof Error && err.message.includes('Invalid JWT')) {
          router.push('/auth/login')
        }
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener only once
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        initializeOnce.current = false
        router.push('/auth/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const profileData = await getProfile(supabase, session.user)
          setProfile(profileData)
          initializeOnce.current = true
        } catch (err) {
          console.error('Profile fetch error:', err)
          setError(err instanceof Error ? err.message : 'Failed to load profile')
          // Don't sign out on profile errors, just log the error
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
