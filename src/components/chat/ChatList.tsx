'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { getUserChats, createPropertyChat } from '@/lib/chat/chatService'

interface ChatItem {
  id: string | null
  title?: string
  property_id?: string
  application_id?: string
  lastMessage?: string
  updatedAt?: string
  created_at?: string
  hasExistingChat?: boolean
  otherParticipant?: {
    id: string
    full_name: string | null
    role: 'tenant' | 'agent'
  } | null
}

export default function ChatList() {
  const [chats, setChats] = useState<ChatItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'tenant' | 'agent' | null>(null)
  const [isCreatingChat, setIsCreatingChat] = useState<string | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleCreateChat = async (chat: ChatItem) => {
    if (!chat.application_id || !chat.otherParticipant || !userId) return
    
    setIsCreatingChat(chat.application_id)
    
    try {
      // We need to get more details for chat creation
      const { data: application } = await supabase
        .from('applications')
        .select(`
          id,
          tenant_id,
          bed:beds!applications_bed_id_fkey(
            room:rooms!beds_room_id_fkey(
              property:properties!rooms_property_id_fkey(
                id,
                title,
                owner_id
              )
            )
          )
        `)
        .eq('id', chat.application_id)
        .single()
        
      if (!application) return
      
      const bed = Array.isArray(application.bed) ? application.bed[0] : application.bed
      const room = Array.isArray(bed?.room) ? bed.room[0] : bed?.room
      const property = Array.isArray(room?.property) ? room.property[0] : room?.property
      
      if (!property) return
      
      // Get current user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()
        
      const context = {
        propertyId: property.id,
        propertyTitle: property.title,
        tenantId: application.tenant_id,
        tenantName: chat.otherParticipant.full_name || 'Unknown User',
        agentId: property.owner_id,
        agentName: userProfile?.full_name || 'Property Owner',
        applicationId: chat.application_id
      }
      
      const chatId = await createPropertyChat(context)
      
      // Refresh chats list
      if (userRole) {
        const updatedChats = await getUserChats(userId, userRole)
        setChats(updatedChats)
      }
      
      // Navigate to the new chat
      window.location.href = `/chat/${chatId}`
      
    } catch (error) {
      console.error('Failed to create chat:', error)
      alert('Failed to create chat. Please try again.')
    } finally {
      setIsCreatingChat(null)
    }
  }

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
            {chats.map((chat, index) => (
              <li key={chat.id || `chat-${index}`}>
                <Link 
                  href={chat.id ? `/chat/${chat.id}` : '#'}
                  className={`block p-3 border-b border-gray-100 dark:border-gray-600 ${
                    chat.hasExistingChat 
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-700' 
                      : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 border-l-4 border-l-blue-500'
                  }`}
                  onClick={async (e) => {
                    if (!chat.hasExistingChat) {
                      e.preventDefault()
                      await handleCreateChat(chat)
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {chat.otherParticipant && (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-xs">
                              {(chat.otherParticipant.full_name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {chat.otherParticipant?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {chat.otherParticipant?.role === 'agent' ? 'Property Owner' : 'Tenant'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                        {chat.title}
                      </div>
                      {chat.lastMessage && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {chat.lastMessage}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-2">
                      {!chat.hasExistingChat && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {isCreatingChat === chat.application_id ? 'Creating...' : 'New'}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(chat.created_at || '').toLocaleDateString()}
                      </div>
                    </div>
                  </div>
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
