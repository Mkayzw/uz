/**
 * Chat system error handling utilities
 */

export class ChatError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

export class AuthenticationError extends ChatError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_REQUIRED')
    this.name = 'AuthenticationError'
  }
}

export class PermissionError extends ChatError {
  constructor(message = 'Permission denied') {
    super(message, 'PERMISSION_DENIED')
    this.name = 'PermissionError'
  }
}

export class NetworkError extends ChatError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

export class ValidationError extends ChatError {
  constructor(message = 'Validation failed') {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * Retry mechanism for failed operations
 */
export class RetryManager {
  private retryCount = 0
  private maxRetries: number
  private baseDelay: number

  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries
    this.baseDelay = baseDelay
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation()
      this.retryCount = 0 // Reset on success
      return result
    } catch (error) {
      if (this.retryCount >= this.maxRetries) {
        throw error
      }

      // Don't retry authentication or permission errors
      if (error instanceof AuthenticationError || error instanceof PermissionError) {
        throw error
      }

      this.retryCount++
      const delay = this.baseDelay * Math.pow(2, this.retryCount - 1) // Exponential backoff
      
      console.warn(`Operation failed, retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.execute(operation)
    }
  }

  reset() {
    this.retryCount = 0
  }
}

/**
 * Message queue for offline scenarios
 */
export class MessageQueue {
  private queue: Array<{
    id: string
    chatId: string
    content: string
    timestamp: number
    retries: number
  }> = []

  private maxRetries = 3
  private isProcessing = false

  add(chatId: string, content: string): string {
    const id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.queue.push({
      id,
      chatId,
      content,
      timestamp: Date.now(),
      retries: 0
    })

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue()
    }

    return id
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    while (this.queue.length > 0) {
      const message = this.queue[0]

      try {
        // Import chatService dynamically to avoid circular dependency
        const { chatService } = await import('./chatService')
        
        await chatService.sendMessage({
          chatId: message.chatId,
          content: message.content
        })

        // Success - remove from queue
        this.queue.shift()
      } catch (error) {
        console.error('Failed to send queued message:', error)
        
        message.retries++
        
        if (message.retries >= this.maxRetries) {
          // Max retries reached - remove from queue
          console.error('Max retries reached for message, removing from queue:', message)
          this.queue.shift()
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000 * message.retries))
        }
      }
    }

    this.isProcessing = false
  }

  getQueuedMessages(chatId: string) {
    return this.queue.filter(msg => msg.chatId === chatId)
  }

  clear() {
    this.queue = []
  }
}

// Export singleton instances
export const messageQueue = new MessageQueue()

/**
 * Utility function to handle and format errors for UI display
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return 'Please log in to continue'
  }
  
  if (error instanceof PermissionError) {
    return 'You don\'t have permission to perform this action'
  }
  
  if (error instanceof NetworkError) {
    return 'Connection error. Please check your internet connection'
  }
  
  if (error instanceof ValidationError) {
    return error.message
  }
  
  if (error instanceof ChatError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}