import { useState, useEffect, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { Property, Application, SavedProperty, UserProfile } from '@/types/dashboard'
import {
  getAgentProperties,
  getAllActiveProperties,
  getTenantApplications,
  getSavedProperties,
  getAgentApplications,
} from '@/lib/utils/dashboard'
import { useSupabaseClient } from './useSupabaseClient'
import { useLoadingStateManager } from './useLoadingStateManager'
import { LoadingPhase } from '@/lib/services/types'
import { networkService } from '@/lib/services/networkService'

interface UseDashboardDataProps {
  user: User | null
  profile: UserProfile | null
  isAuthenticated?: boolean
  authError?: string
}

export function useDashboardData({ user, profile, isAuthenticated = false, authError }: UseDashboardDataProps) {
  const supabase = useSupabaseClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [agentApplications, setAgentApplications] = useState<Application[]>([])
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])

  // Track if data has been loaded to prevent unnecessary reloads
  const dataLoadedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)
  const lastProfileRoleRef = useRef<string | null>(null)

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
      console.log('Data loading phase changed to:', phase)
    },
    onError: (error, errorType) => {
      console.error('Data loading error:', error, 'Type:', errorType)
    },
    onRetry: (retryCount) => {
      console.log('Data loading retry attempt:', retryCount)
    }
  })

  // Enhanced data loading with dependency management and retry capabilities
  const loadData = useCallback(async () => {
    return await executeWithRetry(
      async () => {
        // Load all active properties for browsing with retry logic
        const allPropsData = await networkService.executeWithRetry(
          () => getAllActiveProperties(supabase),
          { maxRetries: 2 }
        )
        setAllProperties(allPropsData)

        // Load role-specific data with retry logic
        if (profile?.role === 'agent' && profile.agent_status === 'active') {
          const [agentPropsData, agentAppsData] = await Promise.all([
            networkService.executeWithRetry(
              () => getAgentProperties(supabase, user!.id),
              { maxRetries: 2 }
            ),
            networkService.executeWithRetry(
              () => getAgentApplications(supabase, user!.id),
              { maxRetries: 2 }
            )
          ])
          setProperties(agentPropsData)
          setAgentApplications(agentAppsData)
        } else {
          // Clear agent-specific data if not an active agent
          setProperties([])
          setAgentApplications([])
        }

        if (profile?.role === 'tenant') {
          const [tenantAppsData, savedPropsData] = await Promise.all([
            networkService.executeWithRetry(
              () => getTenantApplications(supabase, user!.id),
              { maxRetries: 2 }
            ),
            networkService.executeWithRetry(
              () => getSavedProperties(supabase, user!.id),
              { maxRetries: 2 }
            )
          ])
          setApplications(tenantAppsData)
          setSavedProperties(savedPropsData)
        } else {
          // Clear tenant-specific data if not a tenant
          setApplications([])
          setSavedProperties([])
        }

        // Mark data as loaded and track current user/profile
        dataLoadedRef.current = true
        lastUserIdRef.current = user?.id || null
        lastProfileRoleRef.current = profile?.role || null

        return true
      },
      LoadingPhase.LOADING_DATA,
      'Failed to load dashboard data'
    )
  }, [user, profile, supabase, executeWithRetry])

  // Check if we need to reload data based on authentication state changes
  const shouldReloadData = useCallback(() => {
    // Don't load if authentication failed
    if (authError) return false

    // Don't load if not authenticated or missing user/profile
    if (!isAuthenticated || !user || !profile) return false

    // Load if data hasn't been loaded yet
    if (!dataLoadedRef.current) return true

    // Reload if user or profile role changed
    if (lastUserIdRef.current !== user.id || lastProfileRoleRef.current !== profile.role) {
      return true
    }

    return false
  }, [isAuthenticated, user, profile, authError])

  // Effect to handle data loading with proper dependency management
  useEffect(() => {
    // Clear error if authentication error is resolved
    if (!authError && hasError) {
      clearError()
    }

    // Don't proceed if authentication failed
    if (authError) {
      setError('Cannot load data: Authentication failed', new Error(authError))
      return
    }

    // Don't proceed if not authenticated
    if (!isAuthenticated) {
      // Reset to initializing state when not authenticated
      if (dataLoadedRef.current) {
        dataLoadedRef.current = false
        lastUserIdRef.current = null
        lastProfileRoleRef.current = null
        reset()
      }
      return
    }

    // Don't proceed if missing user or profile
    if (!user || !profile) {
      setPhase(LoadingPhase.LOADING_PROFILE)
      return
    }

    // Load data if needed
    if (shouldReloadData()) {
      loadData()
    } else if (dataLoadedRef.current) {
      // Data already loaded and current, set to ready
      setPhase(LoadingPhase.READY)
    }
  }, [isAuthenticated, user, profile, authError, shouldReloadData, loadData, hasError, clearError, setError, setPhase, reset])

  // Enhanced refresh function with retry capabilities
  const refreshData = useCallback(async () => {
    if (!user || !profile || !isAuthenticated) {
      console.warn('Cannot refresh data: missing authentication or user data')
      return false
    }

    // Clear any existing errors before refreshing
    clearError()

    // Force reload by resetting the loaded flag
    dataLoadedRef.current = false

    const result = await loadData()
    return result !== null
  }, [user, profile, isAuthenticated, loadData, clearError])

  // Manual retry function for data loading
  const retryDataLoading = useCallback(async () => {
    if (!isAuthenticated || !user || !profile) {
      setError('Cannot retry: Authentication required', new Error('Not authenticated'))
      return false
    }

    // Clear error state
    clearError()

    // Wait for network connection if offline
    if (!networkService.isOnline()) {
      console.log('Waiting for network connection before retrying data loading...')
      const connectionRestored = await networkService.waitForConnection(10000)
      if (!connectionRestored) {
        setError('Network connection required for data loading. Please check your internet connection.', new Error('Network offline'))
        return false
      }
    }

    // Reset loaded flag to force reload
    dataLoadedRef.current = false

    // Retry data loading
    const result = await loadData()
    return result !== null
  }, [isAuthenticated, user, profile, clearError, setError, loadData])

  // Clear error function
  const clearDataError = useCallback(() => {
    clearError()
  }, [clearError])

  // Memoize setter functions to prevent unnecessary re-renders
  const memoizedSetProperties = useCallback(setProperties, [])
  const memoizedSetAllProperties = useCallback(setAllProperties, [])
  const memoizedSetApplications = useCallback(setApplications, [])
  const memoizedSetAgentApplications = useCallback(setAgentApplications, [])
  const memoizedSetSavedProperties = useCallback(setSavedProperties, [])

  // Check if we can retry data loading
  const canRetryData = hasError && loadingState.canRetry && isAuthenticated && user && profile

  return {
    // Data state
    properties,
    allProperties,
    applications,
    agentApplications,
    savedProperties,

    // Loading state (backward compatibility)
    loading: isLoading,
    error: hasError ? getErrorMessage() : '',

    // Enhanced loading state
    loadingState,
    isLoading,
    hasError,
    loadingMessage: getLoadingMessage(),
    errorMessage: getErrorMessage(),

    // Data loading status
    isDataLoaded: dataLoadedRef.current,

    // Retry capabilities
    canRetryData,
    retryDataLoading,

    // Actions
    refreshData,
    clearDataError,

    // Setter functions (for backward compatibility)
    setProperties: memoizedSetProperties,
    setAllProperties: memoizedSetAllProperties,
    setApplications: memoizedSetApplications,
    setAgentApplications: memoizedSetAgentApplications,
    setSavedProperties: memoizedSetSavedProperties
  }
}
