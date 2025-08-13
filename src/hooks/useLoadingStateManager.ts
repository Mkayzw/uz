import { useState, useCallback, useRef } from 'react'
import { LoadingPhase, ErrorType, LoadingState } from '@/lib/services/types'
import { networkService } from '@/lib/services/networkService'

interface LoadingStateManagerOptions {
  maxRetries?: number
  onPhaseChange?: (phase: LoadingPhase) => void
  onError?: (error: string, errorType: ErrorType) => void
  onRetry?: (retryCount: number) => void
}

export function useLoadingStateManager(options: LoadingStateManagerOptions = {}) {
  const {
    maxRetries = 3,
    onPhaseChange,
    onError,
    onRetry
  } = options

  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: LoadingPhase.INITIALIZING,
    retryCount: 0,
    canRetry: false,
    isRetrying: false
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  /**
   * Transition to a new loading phase
   */
  const setPhase = useCallback((phase: LoadingPhase) => {
    setLoadingState(prev => {
      const newState = { ...prev, phase }
      
      // Clear error when moving to a non-error phase
      if (phase !== LoadingPhase.ERROR) {
        newState.error = undefined
        newState.errorType = undefined
        newState.canRetry = false
      }
      
      return newState
    })
    
    onPhaseChange?.(phase)
  }, [onPhaseChange])

  /**
   * Set error state with proper classification
   */
  const setError = useCallback((error: string | Error, originalError?: any) => {
    const errorMessage = error instanceof Error ? error.message : error
    const errorType = originalError ? networkService.classifyError(originalError) : ErrorType.UNKNOWN
    const canRetry = originalError ? networkService.shouldRetry(originalError, loadingState.retryCount) : false

    setLoadingState(prev => ({
      ...prev,
      phase: LoadingPhase.ERROR,
      error: errorMessage,
      errorType,
      canRetry: canRetry && prev.retryCount < maxRetries,
      isRetrying: false
    }))

    onError?.(errorMessage, errorType)
  }, [loadingState.retryCount, maxRetries, onError])

  /**
   * Clear error state and reset to initializing
   */
  const clearError = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      phase: LoadingPhase.INITIALIZING,
      error: undefined,
      errorType: undefined,
      canRetry: false,
      isRetrying: false
    }))
  }, [])

  /**
   * Increment retry counter
   */
  const incrementRetryCount = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      isRetrying: true
    }))
  }, [])

  /**
   * Reset retry counter
   */
  const resetRetryCount = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      retryCount: 0,
      isRetrying: false
    }))
  }, [])

  /**
   * Execute a retry operation
   */
  const retry = useCallback(async (retryOperation: () => Promise<void>) => {
    if (!loadingState.canRetry || loadingState.isRetrying) {
      return
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    incrementRetryCount()
    onRetry?.(loadingState.retryCount + 1)

    try {
      // Add a small delay before retrying to prevent rapid successive retries
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, 500)
      })

      clearError()
      await retryOperation()
    } catch (error) {
      console.error('Retry operation failed:', error)
      setError(error instanceof Error ? error : 'Retry failed', error)
    }
  }, [loadingState.canRetry, loadingState.isRetrying, loadingState.retryCount, incrementRetryCount, onRetry, clearError, setError])

  /**
   * Execute an operation with automatic error handling and state management
   */
  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    phase: LoadingPhase,
    errorMessage: string = 'Operation failed'
  ): Promise<T | null> => {
    try {
      setPhase(phase)
      const result = await operation()
      return result
    } catch (error) {
      console.error(`${errorMessage}:`, error)
      setError(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
      return null
    }
  }, [setPhase, setError])

  /**
   * Execute an operation with network retry logic
   */
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    phase: LoadingPhase,
    errorMessage: string = 'Operation failed'
  ): Promise<T | null> => {
    try {
      setPhase(phase)
      const result = await networkService.executeWithRetry(operation, { maxRetries })
      return result
    } catch (error) {
      console.error(`${errorMessage}:`, error)
      setError(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
      return null
    }
  }, [setPhase, setError, maxRetries])

  /**
   * Check if currently in a loading phase
   */
  const isLoading = loadingState.phase !== LoadingPhase.READY && loadingState.phase !== LoadingPhase.ERROR

  /**
   * Check if in error state
   */
  const hasError = loadingState.phase === LoadingPhase.ERROR

  /**
   * Get user-friendly loading message based on current phase
   */
  const getLoadingMessage = useCallback((): string => {
    switch (loadingState.phase) {
      case LoadingPhase.INITIALIZING:
        return 'Initializing dashboard...'
      case LoadingPhase.AUTHENTICATING:
        return 'Verifying authentication...'
      case LoadingPhase.LOADING_PROFILE:
        return 'Loading your profile...'
      case LoadingPhase.LOADING_DATA:
        return 'Loading dashboard data...'
      case LoadingPhase.READY:
        return 'Dashboard ready'
      case LoadingPhase.ERROR:
        return loadingState.error || 'An error occurred'
      default:
        return 'Loading...'
    }
  }, [loadingState.phase, loadingState.error])

  /**
   * Get user-friendly error message with retry information
   */
  const getErrorMessage = useCallback((): string => {
    if (!hasError || !loadingState.error) return ''

    let message = loadingState.error

    if (loadingState.retryCount > 0) {
      message += ` (Attempt ${loadingState.retryCount + 1}/${maxRetries + 1})`
    }

    if (loadingState.canRetry) {
      message += ' - You can try again.'
    }

    return message
  }, [hasError, loadingState.error, loadingState.retryCount, loadingState.canRetry, maxRetries])

  /**
   * Reset the entire loading state
   */
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    setLoadingState({
      phase: LoadingPhase.INITIALIZING,
      retryCount: 0,
      canRetry: false,
      isRetrying: false
    })
  }, [])

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  return {
    // State
    loadingState,
    isLoading,
    hasError,
    
    // Phase management
    setPhase,
    
    // Error management
    setError,
    clearError,
    
    // Retry management
    retry,
    incrementRetryCount,
    resetRetryCount,
    
    // Operation execution
    executeOperation,
    executeWithRetry,
    
    // Utility functions
    getLoadingMessage,
    getErrorMessage,
    reset,
    cleanup
  }
}