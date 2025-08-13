/**
 * Shared types for network and loading services
 */

export enum LoadingPhase {
  INITIALIZING = 'initializing',
  AUTHENTICATING = 'authenticating',
  LOADING_PROFILE = 'loading-profile',
  LOADING_DATA = 'loading-data',
  READY = 'ready',
  ERROR = 'error'
}

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_LOADING = 'data-loading',
  UNKNOWN = 'unknown'
}

export interface LoadingState {
  phase: LoadingPhase
  error?: string
  errorType?: ErrorType
  retryCount: number
  canRetry: boolean
  isRetrying: boolean
}

export interface RetryConfig {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

export interface NetworkError extends Error {
  type: ErrorType
  retryable: boolean
  statusCode?: number
  originalError?: any
}