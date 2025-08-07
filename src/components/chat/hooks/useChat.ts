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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let subscription: any
    async function init() {
      // get current user
      const { data: userData } = await supabase.auth.getUser()
      const id = userData?.user?.id || null
      setUserId(id)

      // fetch initial messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
      if (error) {
        console.error('Error loading messages:', error)
      } else if (data) {
        setMessages(data)
      }

      // subscribe to new messages
      subscription = supabase
        .channel(`public:messages:chat_id=eq.${chatId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, payload => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()
    }

    init()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [chatId])

  async function sendMessage(content: string) {
    if (!userId) return
    const { error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, sender_id: userId, content })
    if (error) console.error('Error sending message:', error)
  }

  return { messages, sendMessage, userId }
}
