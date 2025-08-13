/**
 * Chat System - Main exports
 * 
 * This module provides a complete chat system for the Unistay platform,
 * including real-time messaging, conversation management, and error handling.
 */

// Core service
export { chatService } from './chatService'

// React hooks
export { useChat, useChatList, useCurrentUser } from './hooks'

// Types
export type {
  Chat,
  Message,
  Conversation,
  ChatDetails,
  ChatParticipant,
  SendMessageRequest,
  CreateChatRequest,
  ChatServiceError
} from './types'

// Error handling
export {
  ChatError,
  AuthenticationError,
  PermissionError,
  NetworkError,
  ValidationError,
  RetryManager,
  MessageQueue,
  messageQueue,
  formatErrorForUser
} from './errors'

// Legacy exports for backward compatibility
export {
  getUserConversations,
  getChatById,
  getChatDetails,
  createPropertyChat,
  getChatMessages,
  sendMessage
} from './chatService'