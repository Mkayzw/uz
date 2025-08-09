'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

export default function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let subscription: any
    
    async function init() {
      try {
        setLoading(true)
        setError(null)
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        const id = userData?.user?.id || null
        setUserId(id)

        if (!id) {
          setError('User not authenticated')
          setLoading(false)
          return
        }

        // Verify user has access to this chat
        const { data: chatAccess, error: accessError } = await supabase
          .from('chats')
          .select('id')
          .eq('id', chatId)
          .single()

        if (accessError || !chatAccess) {
          setError('Chat not found or access denied')
          setLoading(false)
          return
        }

        // Fetch initial messages
        const { data, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
          
        if (messagesError) {
          console.error('Error loading messages:', messagesError)
          setError('Failed to load messages')
        } else if (data) {
          setMessages(data)
        }

        // Subscribe to new messages
        subscription = supabase
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
              setMessages(prev => [...prev, payload.new as Message])
            }
          )
          .subscribe()
          
      } catch (err) {
        console.error('Error initializing chat:', err)
        setError('Failed to initialize chat')
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [chatId])

  async function sendMessage(content: string) {
    if (!userId || !content.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userId,
          content: content.trim()
        })
        
      if (error) {
        console.error('Error sending message:', error)
        throw new Error('Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }

  return { 
    messages, 
    sendMessage, 
    userId,
    loading,
    error
  }
}
