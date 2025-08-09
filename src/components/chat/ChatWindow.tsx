'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import useChat from './hooks/useChat'
import { getChatDetails, ChatDetails } from '@/lib/chat/chatService'

interface ChatWindowProps {
  chatId: string
  onOpenSidebar?: () => void
}

export default function ChatWindow({ chatId, onOpenSidebar }: ChatWindowProps) {
  const { messages } = useChat(chatId)
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch chat details when component mounts
  useEffect(() => {
    async function fetchChatDetails() {
      try {
        setLoading(true)
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        setCurrentUserId(userId || null)

        // Get chat details
        const details = await getChatDetails(chatId)
        setChatDetails(details)
        
      } catch (error) {
        console.error('Error fetching chat details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (chatId) {
      fetchChatDetails()
    }
  }, [chatId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getMessageAlignment = (senderId: string) => {
    return senderId === currentUserId ? 'justify-end' : 'justify-start'
  }

  const getMessageStyle = (senderId: string) => {
    return senderId === currentUserId 
      ? 'bg-blue-500 text-white ml-auto' 
      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
  }

  const getSenderInfo = (senderId: string) => {
    if (!chatDetails) return { name: 'Loading...', role: '' }
    
    if (senderId === chatDetails.tenant_id) {
      return {
        name: chatDetails.tenant_name || 'Unknown User',
        role: 'Tenant'
      }
    } else if (senderId === chatDetails.agent_id) {
      return {
        name: chatDetails.agent_name || 'Unknown User',
        role: 'Property Owner'
      }
    }
    
    return { name: 'Unknown User', role: '' }
  }

  const getOtherParticipant = () => {
    if (!chatDetails || !currentUserId) return null
    
    if (currentUserId === chatDetails.tenant_id) {
      return {
        id: chatDetails.agent_id,
        full_name: chatDetails.agent_name,
        role: 'agent' as const
      }
    } else {
      return {
        id: chatDetails.tenant_id,
        full_name: chatDetails.tenant_name,
        role: 'tenant' as const
      }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading chat...</div>
      </div>
    )
  }

  if (!chatDetails) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500">Chat not found</div>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      {otherParticipant && (
        <div
          className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white/95 dark:bg-gray-800/95 sticky top-0 z-10 backdrop-blur-supported"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center space-x-3">
            {/* Mobile: open chat list */}
            {onOpenSidebar && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="sm:hidden p-2 -ml-2 mr-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                aria-label="Open chats"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M3.75 6.75a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {(otherParticipant.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {otherParticipant.full_name || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {otherParticipant.role === 'agent' ? 'Property Owner' : 'Tenant'}
              </p>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 truncate">
            Property: {chatDetails.property_title}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 hide-scrollbar smooth-scroll">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const senderInfo = getSenderInfo(msg.sender_id)
            const isCurrentUser = msg.sender_id === currentUserId
            
            return (
              <div key={msg.id} className={`flex ${getMessageAlignment(msg.sender_id)}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyle(msg.sender_id)}`}>
                  {!isCurrentUser && (
                    <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                      {senderInfo.name} ({senderInfo.role})
                    </div>
                  )}
                  <div className="text-sm">{msg.content}</div>
                  <div className={`text-xs mt-1 ${
                    isCurrentUser 
                      ? 'text-blue-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
