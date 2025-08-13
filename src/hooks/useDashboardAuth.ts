import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'
import { getProfile } from '@/lib/utils/dashboard'
import { useSupabaseClient } from './useSupabaseClient'
import { useLoadingStateManager } from './useLoadingStateManager'
import { LoadingPhase, ErrorType } from '@/lib/services/types'
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
  
  // Use loading state manager for better error handling and retry capabilities
  const {
    loadingState,
    isLoading,
    hasError,
    setPhase,
    setError,
    clearError,
    executeWithRetry,
    getLoadingMessage,
    getErrorMessage,
    reset
  } = useLoadingStateManager({
    maxRetries: 3,
    onPhaseChange: (phase) => {
      console.log('Auth phase changed to:', phase)
    },
    onError: (error, errorType) => {
      console.error('Auth error:', error, 'Type:', errorType)
    },
    onRetry: (retryCount) => {
      console.log('Auth retry attempt:', retryCount)
    }
  })

  // Enhanced session restoration with retry capabilities
  const restoreSession = useCallback(async (): Promise<boolean> => {
    return await executeWithRetry(
      async () => {
        // Use network service for Supabase operations with built-in retry
        const result = await networkService.executeSupabaseOperation(
          async () => {
            const { data, error } = await supabase.auth.getSession()
            return { data: data.session, error }
          }
        )
        
        if (result.error) {
          throw result.error
        }

        if (!result.data?.user) {
          // Store current path for redirect after login
          const currentPath = window.location.pathname + window.location.search
          if (currentPath !== '/dashboard' && !currentPath.startsWith('/auth/')) {
            localStorage.setItem('redirect_after_auth', currentPath)
          }
          return false
        }

        setUser(result.data.user)
        return true
      },
      LoadingPhase.AUTHENTICATING,
      'Failed to restore session'
    ) !== null
  }, [supabase, executeWithRetry])

  // Enhanced profile loading with retry capabilities
  const loadProfile = useCallback(async (user: User): Promise<boolean> => {
    return await executeWithRetry(
      async () => {
        // Wrap profile loading with network retry logic
        const profileData = await networkService.executeWithRetry(
          () => getProfile(supabase, user),
          { maxRetries: 2 } // Fewer retries for profile loading
        )
        setProfile(profileData)
        return profileData
      },
      LoadingPhase.LOADING_PROFILE,
      'Failed to load profile'
    ) !== null
  }, [supabase, executeWithRetry])

  // Enhanced sign out with proper cleanup and retry logic
  const handleSignOut = useCallback(async () => {
    try {
      // Use network service for sign out with retry capability
      await networkService.executeWithRetry(
        () => supabase.auth.signOut(),
        { maxRetries: 1 } // Only retry once for sign out
      )
      
      setUser(null)
      setProfile(null)
      initializeOnce.current = false
      isInitializingRef.current = false
      initializationPromiseRef.current = null
      reset()
      
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
      reset()
      localStorage.removeItem('redirect_after_auth')
      router.push('/')
    }
  }, [supabase, router, reset])

  // Enhanced authentication initialization with race condition prevention
  const initializeAuth = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializeOnce.current || isInitializingRef.current) {
      // If already initialized, just set to ready
      if (initializeOnce.current) {
        setPhase(LoadingPhase.READY)
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
        setPhase(LoadingPhase.INITIALIZING)

        // Step 1: Restore session with enhanced error handling
        const sessionRestored = await restoreSession()
        
        if (!sessionRestored) {
          setPhase(LoadingPhase.READY)
          initializeOnce.current = true
          
          // Check if we should redirect to login
          const currentPath = window.location.pathname
          if (!currentPath.startsWith('/auth/')) {
            router.push('/auth/login')
          }
          return
        }

        // Step 2: Load profile if we have a user
        if (user) {
          const profileLoaded = await loadProfile(user)
          
          if (!profileLoaded) {
            // Profile loading failed, but don't sign out - just show error
            console.warn('Profile loading failed, but keeping user authenticated')
          }
        }

        initializeOnce.current = true
        setPhase(LoadingPhase.READY)
      } catch (err) {
        console.error('Auth initialization error:', err)
        
        // Classify error and handle appropriately
        const errorType = networkService.classifyError(err)
        
        if (errorType === ErrorType.AUTHENTICATION) {
          // Authentication errors should redirect to login
          initializeOnce.current = false // Allow retry after auth error
          router.push('/auth/login')
        } else if (errorType === ErrorType.NETWORK) {
          // Network errors should be retryable
          setError('Network error during authentication. Please check your connection.', err)
        } else {
          // Other errors
          setError(err instanceof Error ? err.message : 'Failed to initialize authentication', err)
        }
      } finally {
        isInitializingRef.current = false
        initializationPromiseRef.current = null
      }
    })()

    initializationPromiseRef.current = initPromise
    await initPromise
  }, [restoreSession, loadProfile, user, router, setPhase, setError])

  // Enhanced auth state change handler with session validation
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    console.log('Auth state change:', event, session?.user?.id)
    
    if (event === 'SIGNED_OUT') {
      setUser(null)
      setProfile(null)
      initializeOnce.current = false
      isInitializingRef.current = false
      initializationPromiseRef.current = null
      reset() // Reset loading state
      
      // Clear stored redirect path
      localStorage.removeItem('redirect_after_auth')
      
      // Only redirect if not already on auth page
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/auth/')) {
        router.push('/auth/login')
      }
    } else if (event === 'SIGNED_IN' && session?.user) {
      // Validate session before proceeding
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || session.user.exp
      
      if (expiresAt && expiresAt <= now) {
        console.warn('Received expired session, ignoring sign in event')
        return
      }
      
      setUser(session.user)
      
      try {
        await loadProfile(session.user)
        initializeOnce.current = true
        setPhase(LoadingPhase.READY)
        
        // Handle redirect after successful authentication
        const redirectPath = localStorage.getItem('redirect_after_auth')
        if (redirectPath && redirectPath !== window.location.pathname) {
          localStorage.removeItem('redirect_after_auth')
          router.push(redirectPath)
        }
      } catch (err) {
        console.error('Profile fetch error after sign in:', err)
        setError('Failed to load profile after sign in', err)
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
      
      // Ensure we're still in ready state after token refresh
      if (initializeOnce.current && loadingState.phase !== LoadingPhase.ERROR) {
        setPhase(LoadingPhase.READY)
      }
    }
  }, [loadProfile, router, reset, setPhase, setError, handleSignOut, loadingState.phase])

  useEffect(() => {
    // Only initialize once to prevent session loss on navigation
    if (initializeOnce.current) {
      return
    }

    initializeAuth()

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
      
      // Clean up initialization promise
      initializationPromiseRef.current = null
      isInitializingRef.current = false
    }
  }, [initializeAuth, handleAuthStateChange, supabase])

  // Manual retry function for authentication with enhanced error recovery
  const retryAuth = useCallback(async () => {
    // Reset all initialization flags
    initializeOnce.current = false
    isInitializingRef.current = false
    initializationPromiseRef.current = null
    
    // Clear error state
    clearError()
    
    // Wait for network connection if offline
    if (!networkService.isOnline()) {
      console.log('Waiting for network connection before retrying auth...')
      const connectionRestored = await networkService.waitForConnection(10000)
      if (!connectionRestored) {
        setError('Network connection required for authentication. Please check your internet connection.', new Error('Network offline'))
        return
      }
    }
    
    // Retry initialization
    await initializeAuth()
  }, [clearError, initializeAuth, setError])

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
  const canRetryAuth = hasError && loadingState.canRetry

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
    
    // Loading state (backward compatibility)
    loading: isLoading,
    error: hasError ? getErrorMessage() : '',
    
    // Enhanced loading state
    loadingState,
    isLoading,
    hasError,
    loadingMessage: getLoadingMessage(),
    errorMessage: getErrorMessage(),
    
    // Retry capabilities
    canRetryAuth,
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