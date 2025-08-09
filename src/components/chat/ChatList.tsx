'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { getUserChats, createPropertyChat } from '@/lib/chat/chatService'

interface ChatItem {
  id: string | null
  title?: string
  property_id?: string
  application_id?: string
  lastMessage?: {
    content: string
    created_at: string
    sender_id: string
  } | null
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const router = useRouter()
  const pathname = usePathname()

  const handleCreateChat = async (chat: ChatItem) => {
    if (!chat.application_id || !userId || isCreatingChat) return

    setIsCreatingChat(chat.application_id)
    setError(null)

    try {
      const chatId = await createPropertyChat({
        applicationId: chat.application_id
      })

      // Navigate to the new chat (client-side)
      router.push(`/chat/${chatId}`)

    } catch (error) {
      console.error('Failed to create chat:', error)
      setError('Failed to create chat. Please try again.')
    } finally {
      setIsCreatingChat(null)
    }
  }

  useEffect(() => {
    let channel: any
    
    async function loadChats() {
      try {
        setLoading(true)
        setError(null)
        
        const { data: usr } = await supabase.auth.getUser()
        const uid = usr?.user?.id || null
        setUserId(uid)
        
        if (!uid) {
          setLoading(false)
          return
        }

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
        setChats(userChats)

        // Subscribe to new messages for real-time updates
        channel = supabase
          .channel('chat-list-updates')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages'
            },
            async (payload) => {
              // Reload chats to get updated last message
              const updatedChats = await getUserChats(uid, role)
              setChats(updatedChats)
            }
          )
          .subscribe()
          
      } catch (err) {
        console.error('Error loading chats:', err)
        setError('Failed to load chats')
      } finally {
        setLoading(false)
      }
    }
    
    loadChats()
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading chats...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

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
            {chats.map((chat, index) => {
              const href = chat.id ? `/chat/${chat.id}` : null
              const isActive = href && typeof window !== 'undefined' && window.location.pathname === href

              const row = (
                <div
                  className={`block p-3 border-b border-gray-100 dark:border-gray-600 ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${
                    chat.hasExistingChat
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 border-l-4 border-l-blue-500'
                  } ${
                    isCreatingChat === chat.application_id ? 'opacity-60 pointer-events-none' : ''
                  }`}
                  aria-busy={isCreatingChat === chat.application_id}
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
                          {chat.lastMessage.content}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-2">
                      {!chat.hasExistingChat && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {isCreatingChat === chat.application_id ? 'Creating...' : 'Start Chat'}
                        </div>
                      )}
                      {chat.lastMessage && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {formatLastMessageTime(chat.lastMessage.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )

              return (
                <li key={chat.id || `chat-${index}`}>
                  {href ? (
                    <Link href={href} className="block">
                      {row}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCreateChat(chat)}
                      className="w-full text-left"
                      disabled={!!isCreatingChat}
                    >
                      {row}
                    </button>
                  )}
                </li>
              )
            })}
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
