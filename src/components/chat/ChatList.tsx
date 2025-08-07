'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { getUserChats } from '@/lib/chat/chatService'

interface ChatItem {
  id: string
  title?: string
  property_id?: string
  application_id?: string
  lastMessage?: string
  updatedAt?: string
}

export default function ChatList() {
  const [chats, setChats] = useState<ChatItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'tenant' | 'agent' | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let channel: any
    async function loadChats() {
      const { data: usr } = await supabase.auth.getUser()
      const uid = usr?.user?.id || null
      setUserId(uid)
      
      if (!uid) return

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single()
      
      const role = profile?.role as 'tenant' | 'agent'
      setUserRole(role)

      // Load user's chats
      const userChats = await getUserChats(uid, role)
      console.log('ChatList: Loaded chats for user:', uid, 'role:', role, 'chats:', userChats)
      setChats(userChats)
      
      // Debug: Check if there are any chats in the database for this user
      const { data: allChats } = await supabase
        .from('chats')
        .select('*')
      console.log('ChatList: All chats in database:', allChats)
      
      const { data: allParticipants } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('user_id', uid)
      console.log('ChatList: All chat participants for user:', allParticipants)

      // subscribe to new chats
      channel = supabase
        .channel('public:chats')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, payload => {
          // Only add if user is a participant
          supabase
            .from('chat_participants')
            .select('*')
            .eq('chat_id', payload.new.id)
            .eq('user_id', uid)
            .then(({ data }) => {
              if (data && data.length > 0) {
                setChats(prev => [payload.new as ChatItem, ...prev])
              }
            })
        })
        .subscribe()
    }
    loadChats()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {userRole === 'tenant' ? 'Chats with property owners' : 'Chats with applicants'}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {chats.length > 0 ? (
          <ul className="space-y-1">
            {chats.map(chat => (
              <li key={chat.id}>
                <Link 
                  href={`/chat/${chat.id}`}
                  className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600"
                >
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {chat.title || `Chat ${chat.id}`}
                  </div>
                  {chat.lastMessage && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                      {chat.lastMessage}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              No messages yet.
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {userRole === 'tenant' 
                ? 'Chats will appear when you apply to properties.' 
                : 'Chats will appear when tenants apply to your properties.'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
