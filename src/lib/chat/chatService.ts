'use client'

import { createBrowserClient } from '@supabase/ssr'
import { 
  Chat, 
  Message, 
  Conversation, 
  ChatDetails, 
  SendMessageRequest, 
  CreateChatRequest,
  ChatServiceError 
} from './types'

/**
 * Chat Service - Handles all chat-related operations
 * This service provides methods for chat management, messaging, and real-time subscriptions
 */
class ChatService {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /**
   * Get all conversations for the current user
   */
  async getUserConversations(): Promise<Conversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        throw this.createError('Failed to fetch conversations', error)
      }

      return data || []
    } catch (error) {
      console.error('[ChatService] Error fetching user conversations:', error)
      throw error
    }
  }

  /**
   * Get a specific chat by ID
   */
  async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const { data, error } = await this.supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Chat not found
        }
        throw this.createError('Failed to fetch chat', error)
      }

      return data
    } catch (error) {
      console.error('[ChatService] Error fetching chat:', error)
      throw error
    }
  }

  /**
   * Get chat details with participant information
   */
  async getChatDetails(chatId: string): Promise<ChatDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', chatId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Chat not found
        }
        throw this.createError('Failed to fetch chat details', error)
      }

      return {
        id: data.id,
        property_id: data.property_id,
        property_title: data.property_title,
        tenant_id: data.tenant_id,
        agent_id: data.agent_id,
        tenant_name: data.tenant_name,
        agent_name: data.agent_name,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('[ChatService] Error fetching chat details:', error)
      throw error
    }
  }

  /**
   * Create a new chat for a property
   */
  async createPropertyChat(request: CreateChatRequest): Promise<string> {
    try {
      const { data: chatId, error } = await this.supabase
        .rpc('get_or_create_property_chat', {
          p_property_id: request.propertyId,
          p_tenant_id: request.tenantId || undefined
        })

      if (error) {
        throw this.createError('Failed to create chat', error)
      }

      if (!chatId) {
        throw new Error('Failed to create chat: No chat ID returned')
      }

      return chatId
    } catch (error) {
      console.error('[ChatService] Error creating property chat:', error)
      throw error
    }
  }

  /**
   * Get all messages for a chat
   */
  async getChatMessages(chatId: string): Promise<Message[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        throw this.createError('Failed to fetch messages', error)
      }

      return data || []
    } catch (error) {
      console.error('[ChatService] Error fetching chat messages:', error)
      throw error
    }
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      
      if (!user.user) {
        throw new Error('User must be authenticated to send messages')
      }

      const messageData = {
        chat_id: request.chatId,
        sender_id: user.user.id,
        content: request.content.trim(),
        message_type: 'text' as const
      }

      const { data, error } = await this.supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) {
        throw this.createError('Failed to send message', error)
      }

      return data
    } catch (error) {
      console.error('[ChatService] Error sending message:', error)
      throw error
    }
  }

  /**
   * Subscribe to new messages in a chat
   */
  subscribeToChat(chatId: string, callback: (message: Message) => void): () => void {
    const channel = this.supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }

  /**
   * Subscribe to chat list updates
   */
  subscribeToChatList(callback: (conversations: Conversation[]) => void): () => void {
    const channel = this.supabase
      .channel('chat-list-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        async () => {
          // Reload conversations when any message changes
          try {
            const conversations = await this.getUserConversations()
            callback(conversations)
          } catch (error) {
            console.error('[ChatService] Error reloading conversations:', error)
          }
        }
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }

  /**
   * Subscribe to typing indicators (placeholder for future implementation)
   */
  subscribeToTyping(chatId: string, callback: (isTyping: boolean, userId: string) => void): () => void {
    // Placeholder for typing indicators - can be implemented later with presence
    return () => {}
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return user?.id || null
    } catch (error) {
      console.error('[ChatService] Error getting current user:', error)
      return null
    }
  }

  /**
   * Check if user has access to a chat
   */
  async hasAccessToChat(chatId: string): Promise<boolean> {
    try {
      const chat = await this.getChatById(chatId)
      return chat !== null
    } catch (error) {
      console.error('[ChatService] Error checking chat access:', error)
      return false
    }
  }

  /**
   * Create a standardized error object
   */
  private createError(message: string, originalError: any): ChatServiceError {
    const error = new Error(message) as ChatServiceError
    error.code = originalError?.code
    error.details = originalError
    return error
  }
}

// Export singleton instance
export const chatService = new ChatService()

// Export individual functions for backward compatibility
export const getUserConversations = () => chatService.getUserConversations()
export const getChatById = (chatId: string) => chatService.getChatById(chatId)
export const getChatDetails = (chatId: string) => chatService.getChatDetails(chatId)
export const createPropertyChat = (request: CreateChatRequest) => chatService.createPropertyChat(request)
export const getChatMessages = (chatId: string) => chatService.getChatMessages(chatId)
export const sendMessage = (request: SendMessageRequest) => chatService.sendMessage(request)

// Export types for external use
export type { 
  Chat, 
  Message, 
  Conversation, 
  ChatDetails, 
  SendMessageRequest, 
  CreateChatRequest,
  ChatServiceError 
}
