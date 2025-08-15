import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'
import { getProfile } from '@/lib/utils/dashboard'
import { useSupabaseClient } from './useSupabaseClient'
import { networkService } from '@/lib/services/networkService'

export function useDashboardAuth() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const initializeOnce = useRef(false)
  const authStateListenerRef = useRef<any>(null)
  const initializationPromiseRef = useRef<Promise<void> | null>(null)
  const isInitializingRef = useRef(false)

  // Simple state management without complex loading state manager
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Simplified session restoration without retry wrapper
  const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Restoring session...')
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ Session restore error:', error)
        return false
      }

      if (!data.session?.user) {
        console.log('ℹ️ No session found')
        // Store current path for redirect after login
        const currentPath = window.location.pathname + window.location.search
        if (currentPath !== '/dashboard' && !currentPath.startsWith('/auth/')) {
          localStorage.setItem('redirect_after_auth', currentPath)
        }
        return false
      }

      console.log('✅ Session restored for user:', data.session.user.id)
      setUser(data.session.user)
      return true
    } catch (error) {
      console.error('❌ Session restore failed:', error)
      return false
    }
  }, [supabase])

  // Simplified profile loading without any complex state management
  const loadProfile = useCallback(async (user: User): Promise<boolean> => {
    console.log('🔄 Starting profile load for user:', user.id, user.email)

    try {
      // Direct profile fetch without any state management wrapper
      console.log('📋 Calling getProfile function directly...')
      const profileData = await getProfile(supabase, user, 0)

      if (profileData) {
        console.log('✅ Profile loaded successfully:', { id: profileData.id, role: profileData.role })
        setProfile(profileData)
        return true
      } else {
        console.error('❌ Profile data is null')
        return false
      }
    } catch (error) {
      console.error('❌ Profile load error caught:', error)
      return false
    }
  }, [supabase])

  // Enhanced sign out with proper cleanup and retry logic
  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()

      setUser(null)
      setProfile(null)
      initializeOnce.current = false
      isInitializingRef.current = false
      initializationPromiseRef.current = null
      setError('')
      setLoading(false)

      // Clear any stored redirect path
      localStorage.removeItem('redirect_after_auth')

      router.push('/')
    } catch (err) {
      console.error('Sign out error:', err)
      // Even if sign out fails, clear local state and redirect
      setUser(null)
      setProfile(null)
      initializeOnce.current = false
      isInitializingRef.current = false
      initializationPromiseRef.current = null
      setError('')
      setLoading(false)
      localStorage.removeItem('redirect_after_auth')
      router.push('/')
    }
  }, [supabase, router])

  // Enhanced authentication initialization with race condition prevention
  const initializeAuth = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializeOnce.current || isInitializingRef.current) {
      // If already initialized, just return
      if (initializeOnce.current) {
        return
      }
      // If currently initializing, wait for the existing promise
      if (initializationPromiseRef.current) {
        await initializationPromiseRef.current
      }
      return
    }

    // Create initialization promise to prevent race conditions
    const initPromise = (async () => {
      try {
        isInitializingRef.current = true

        // Step 1: Restore session with enhanced error handling
        const sessionRestored = await restoreSession()

        if (!sessionRestored) {
          initializeOnce.current = true

          // Check if we should redirect to login
          const currentPath = window.location.pathname
          if (!currentPath.startsWith('/auth/')) {
            router.push('/auth/login')
          }
          return
        }

        // Step 2: Load profile if we have a user from session restore
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('🔄 Loading profile during initialization for user:', session.user.id)
          setUser(session.user)
          const profileLoaded = await loadProfile(session.user)

          if (!profileLoaded) {
            console.warn('Profile loading failed during initialization, but keeping user authenticated')
          }
        }

        initializeOnce.current = true
      } catch (err) {
        console.error('Auth initialization error:', err)

        // Simple error handling
        console.error('Auth initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication')
      } finally {
        isInitializingRef.current = false
        initializationPromiseRef.current = null
      }
    })()

    initializationPromiseRef.current = initPromise
    await initPromise
  }, [restoreSession, loadProfile, user, router])

  // Enhanced auth state change handler with session validation
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    console.log('Auth state change:', event, session?.user?.id)

    if (event === 'SIGNED_OUT') {
      setUser(null)
      setProfile(null)
      initializeOnce.current = false
      isInitializingRef.current = false
      initializationPromiseRef.current = null
      setError('')
      setLoading(false)

      // Clear stored redirect path
      localStorage.removeItem('redirect_after_auth')

      // Only redirect if not already on auth page
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/auth/')) {
        router.push('/auth/login')
      }
    } else if (event === 'SIGNED_IN' && session?.user) {
      // Skip if already initialized to avoid conflicts
      if (initializeOnce.current) {
        console.log('ℹ️ Skipping SIGNED_IN event - already initialized')
        return
      }

      // Validate session before proceeding
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || session.user.exp

      if (expiresAt && expiresAt <= now) {
        console.warn('Received expired session, ignoring sign in event')
        return
      }

      setUser(session.user)

      try {
        console.log('🔄 Loading profile after sign in for user:', session.user.id)
        const profileLoaded = await loadProfile(session.user)

        if (profileLoaded) {
          initializeOnce.current = true

          // Handle redirect after successful authentication
          const redirectPath = localStorage.getItem('redirect_after_auth')
          if (redirectPath && redirectPath !== window.location.pathname) {
            localStorage.removeItem('redirect_after_auth')
            router.push(redirectPath)
          }
        } else {
          console.error('❌ Profile loading failed after sign in')
        }
      } catch (err) {
        console.error('❌ Profile fetch error after sign in:', err)
    
      }
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      // Handle token refresh - validate new token and maintain user state
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || session.user.exp

      if (expiresAt && expiresAt <= now) {
        console.warn('Received expired token during refresh, signing out')
        await handleSignOut()
        return
      }

      setUser(session.user)
      console.log('Token refreshed successfully')

      // Token refreshed successfully
      console.log('Token refreshed successfully')
    }
  }, [loadProfile, router, handleSignOut])

  useEffect(() => {
    // Only initialize once to prevent session loss on navigation
    if (initializeOnce.current) {
      return
    }

    console.log('🚀 Starting one-time initialization...')

    const initialize = async () => {
      try {
        // Simple session check
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          console.log('✅ Found existing session for user:', session.user.id)
          setUser(session.user)

          // Load profile
          try {
            const profileData = await getProfile(supabase, session.user, 0)
            if (profileData) {
              console.log('✅ Profile loaded:', { id: profileData.id, role: profileData.role })
              setProfile(profileData)
            }
          } catch (err) {
            console.error('❌ Profile loading failed:', err)
          }
        }

        initializeOnce.current = true
        console.log('✅ Initialization complete')
      } catch (err) {
        console.error('❌ Initialization failed:', err)
        initializeOnce.current = true // Still mark as initialized to prevent retry loop
      }
    }

    initialize()

    // Set up auth state change listener only once
    if (!authStateListenerRef.current) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
      authStateListenerRef.current = subscription
    }

    return () => {
      if (authStateListenerRef.current) {
        authStateListenerRef.current.unsubscribe()
        authStateListenerRef.current = null
      }
    }
  }, [supabase])

  // Manual retry function for authentication with enhanced error recovery
  const retryAuth = useCallback(async () => {
    // Reset all initialization flags
    initializeOnce.current = false
    isInitializingRef.current = false
    initializationPromiseRef.current = null

    // Clear error state
    setError('')

    // Retry initialization
    await initializeAuth()
  }, [initializeAuth])

  // Enhanced session validation function
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      const result = await networkService.executeSupabaseOperation(
        async () => {
          const { data, error } = await supabase.auth.getUser()
          return { data: data.user ? { user: data.user } : null, error }
        },
        { maxRetries: 1 }
      )

      if (result.error || !result.data?.user) {
        console.warn('Session validation failed:', result.error)
        return false
      }

      // Check if user ID matches
      if (result.data.user.id !== user.id) {
        console.warn('User ID mismatch during session validation')
        return false
      }

      return true
    } catch (err) {
      console.error('Session validation error:', err)
      return false
    }
  }, [user, supabase])

  // Check if we can retry authentication
  const canRetryAuth = !!error

  // Enhanced session refresh function
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await networkService.executeSupabaseOperation(
        async () => {
          const { data, error } = await supabase.auth.refreshSession()
          return { data: data.session, error }
        },
        { maxRetries: 2 }
      )

      if (result.error || !result.data?.user) {
        console.warn('Session refresh failed:', result.error)
        return false
      }

      setUser(result.data.user)
      return true
    } catch (err) {
      console.error('Session refresh error:', err)
      return false
    }
  }, [supabase])

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return {
    // User state
    user,
    profile,
    displayName,

    // Simple loading state
    loading,
    error,

    // Retry capabilities
    canRetryAuth: !!error,
    retryAuth,

    // Session management
    validateSession,
    refreshSession,

    // Initialization state
    isInitialized: initializeOnce.current,
    isInitializing: isInitializingRef.current,

    // Actions
    handleSignOut
  }
}