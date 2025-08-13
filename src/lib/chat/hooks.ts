'use client'

import { useState, useEffect, useCallback } from 'react'
import { chatService } from './chatService'
import { Message, Conversation, ChatDetails } from './types'

/**
 * Hook for managing a single chat conversation
 */
export function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Load initial chat data
  useEffect(() => {
    if (!chatId) return

    const loadChatData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load chat details and messages in parallel
        const [details, messages] = await Promise.all([
          chatService.getChatDetails(chatId),
          chatService.getChatMessages(chatId)
        ])

        setChatDetails(details)
        setMessages(messages)
      } catch (err) {
        console.error('Error loading chat data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chat')
      } finally {
        setLoading(false)
      }
    }

    loadChatData()
  }, [chatId])

  // Subscribe to new messages
  useEffect(() => {
    if (!chatId) return

    const unsubscribe = chatService.subscribeToChat(chatId, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
    })

    return unsubscribe
  }, [chatId])

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending) return

    try {
      setSending(true)
      setError(null)

      await chatService.sendMessage({
        chatId,
        content: content.trim()
      })

      // Message will be added via real-time subscription
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    } finally {
      setSending(false)
    }
  }, [chatId, sending])

  return {
    messages,
    chatDetails,
    loading,
    error,
    sending,
    sendMessage
  }
}

/**
 * Hook for managing the user's chat list
 */
export function useChatList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await chatService.getUserConversations()
        setConversations(data)
      } catch (err) {
        console.error('Error loading conversations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  // Subscribe to chat list updates
  useEffect(() => {
    const unsubscribe = chatService.subscribeToChatList((updatedConversations) => {
      setConversations(updatedConversations)
    })

    return unsubscribe
  }, [])

  // Create new chat function
  const createChat = useCallback(async (propertyId: string, tenantId?: string) => {
    try {
      setError(null)
      
      const chatId = await chatService.createPropertyChat({
        propertyId,
        tenantId
      })

      // Reload conversations to include the new chat
      const updatedConversations = await chatService.getUserConversations()
      setConversations(updatedConversations)

      return chatId
    } catch (err) {
      console.error('Error creating chat:', err)
      setError(err instanceof Error ? err.message : 'Failed to create chat')
      throw err
    }
  }, [])

  return {
    conversations,
    loading,
    error,
    createChat
  }
}

/**
 * Hook for getting current user information
 */
export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const id = await chatService.getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Error getting current user:', error)
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [])

  return { userId, loading }
}