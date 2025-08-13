/**
 * Network Resilience Service
 * Handles network-related errors, retries, and connectivity issues
 */

import { ErrorType, RetryConfig, NetworkError } from './types'

class NetworkService {
  private defaultConfig: Required<RetryConfig> = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  }

  /**
   * Execute an operation with automatic retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config }
    let lastError: any

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Don't retry on the last attempt
        if (attempt === finalConfig.maxRetries) {
          break
        }

        // Check if error is retryable
        if (!this.shouldRetry(error, attempt)) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelayMs
        )

        console.log(`Network operation failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}), retrying in ${delay}ms:`, error)
        
        await this.delay(delay)
      }
    }

    // If we get here, all retries failed
    throw this.createNetworkError(lastError)
  }

  /**
   * Check if an error is network-related
   */
  isNetworkError(error: any): boolean {
    if (!error) return false

    // Check for common network error indicators
    const networkErrorCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_ERROR',
      'FETCH_ERROR',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_CONNECTION_REFUSED',
      'ERR_CONNECTION_RESET',
      'ERR_CONNECTION_TIMED_OUT'
    ]

    // Check error code
    if (error.code && networkErrorCodes.includes(error.code)) {
      return true
    }

    // Check error message
    const message = error.message?.toLowerCase() || ''
    const networkKeywords = [
      'network',
      'connection',
      'timeout',
      'fetch',
      'offline',
      'internet',
      'connectivity'
    ]

    if (networkKeywords.some(keyword => message.includes(keyword))) {
      return true
    }

    // Check for HTTP status codes that indicate network issues
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode
      // 408 Request Timeout, 429 Too Many Requests, 502-504 Server errors
      if (status === 408 || status === 429 || (status >= 502 && status <= 504)) {
        return true
      }
    }

    // Check for AbortError (request was aborted)
    if (error.name === 'AbortError') {
      return true
    }

    return false
  }

  /**
   * Check if an error is authentication-related
   */
  isAuthenticationError(error: any): boolean {
    if (!error) return false

    // Check status codes
    if (error.status === 401 || error.statusCode === 401) {
      return true
    }

    // Check error messages
    const message = error.message?.toLowerCase() || ''
    const authKeywords = [
      'unauthorized',
      'invalid jwt',
      'token expired',
      'authentication',
      'invalid session',
      'session expired'
    ]

    return authKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if an error is authorization-related
   */
  isAuthorizationError(error: any): boolean {
    if (!error) return false

    // Check status codes
    if (error.status === 403 || error.statusCode === 403) {
      return true
    }

    // Check error messages
    const message = error.message?.toLowerCase() || ''
    const authzKeywords = [
      'forbidden',
      'access denied',
      'insufficient permissions',
      'authorization'
    ]

    return authzKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: any, attempt: number): boolean {
    // Don't retry authentication/authorization errors
    if (this.isAuthenticationError(error) || this.isAuthorizationError(error)) {
      return false
    }

    // Retry network errors
    if (this.isNetworkError(error)) {
      return true
    }

    // Retry 5xx server errors (but not 4xx client errors)
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode
      return status >= 500 && status < 600
    }

    // Don't retry unknown errors by default
    return false
  }

  /**
   * Classify error type
   */
  classifyError(error: any): ErrorType {
    if (this.isNetworkError(error)) {
      return ErrorType.NETWORK
    }
    
    if (this.isAuthenticationError(error)) {
      return ErrorType.AUTHENTICATION
    }
    
    if (this.isAuthorizationError(error)) {
      return ErrorType.AUTHORIZATION
    }

    // Check if it's a data loading error (4xx client errors)
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode
      if (status >= 400 && status < 500 && status !== 401 && status !== 403) {
        return ErrorType.DATA_LOADING
      }
    }

    return ErrorType.UNKNOWN
  }

  /**
   * Create a standardized network error
   */
  createNetworkError(originalError: any): NetworkError {
    const errorType = this.classifyError(originalError)
    const retryable = this.shouldRetry(originalError, 0)
    
    const networkError = new Error(
      originalError?.message || 'Network operation failed'
    ) as NetworkError
    
    networkError.type = errorType
    networkError.retryable = retryable
    networkError.originalError = originalError
    
    if (originalError?.status || originalError?.statusCode) {
      networkError.statusCode = originalError.status || originalError.statusCode
    }

    return networkError
  }

  /**
   * Check if the browser is online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  /**
   * Wait for network connection to be restored
   */
  waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true)
        return
      }

      const timeout = setTimeout(() => {
        window.removeEventListener('online', onOnline)
        resolve(false)
      }, timeoutMs)

      const onOnline = () => {
        clearTimeout(timeout)
        window.removeEventListener('online', onOnline)
        resolve(true)
      }

      window.addEventListener('online', onOnline)
    })
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Wrap a Supabase operation with retry logic
   */
  async executeSupabaseOperation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    config: RetryConfig = {}
  ): Promise<{ data: T | null; error: any }> {
    return this.executeWithRetry(async () => {
      const result = await operation()
      
      // If there's an error, throw it so the retry logic can handle it
      if (result.error) {
        throw result.error
      }
      
      return result
    }, config)
  }
}

// Export singleton instance
export const networkService = new NetworkService()
export default networkService