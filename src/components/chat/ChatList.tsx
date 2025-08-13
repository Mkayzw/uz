'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useChatList, useCurrentUser } from '@/lib/chat/hooks'
import { formatErrorForUser } from '@/lib/chat/errors'
import { Conversation } from '@/lib/chat/types'

interface ChatListProps {
  onChatSelect?: (chatId: string) => void
  className?: string
}

export default function ChatList({ onChatSelect, className = '' }: ChatListProps) {
  const { conversations, loading, error } = useChatList()
  const { userId } = useCurrentUser()
  const pathname = usePathname()

  // Get current user's role from conversations
  const userRole = useMemo(() => {
    if (!conversations.length || !userId) return null
    
    const firstConversation = conversations[0]
    return firstConversation.tenant_id === userId ? 'tenant' : 'agent'
  }, [conversations, userId])

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

  const getOtherParticipant = (conversation: Conversation) => {
    if (!userId) return null
    
    if (conversation.tenant_id === userId) {
      return {
        id: conversation.agent_id,
        full_name: conversation.agent_name,
        role: 'agent' as const
      }
    } else {
      return {
        id: conversation.tenant_id,
        full_name: conversation.tenant_name,
        role: 'tenant' as const
      }
    }
  }

  const handleChatClick = (chatId: string) => {
    if (onChatSelect) {
      onChatSelect(chatId)
    }
  }

  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Loading conversations...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center p-4 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-red-600 dark:text-red-400 font-medium">
            {formatErrorForUser(error)}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {userRole === 'tenant' ? 'Conversations with property agents' : 'Conversations with tenants'}
        </p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              const href = `/chat/${conversation.id}`
              const isActive = pathname === href
              
              if (!otherParticipant) return null

              const conversationItem = (
                <div
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleChatClick(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {(otherParticipant.full_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {otherParticipant.full_name || 'Unknown User'}
                        </div>
                        {conversation.last_message && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                            {formatLastMessageTime(conversation.last_message.created_at)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {otherParticipant.role === 'agent' ? 'Property Agent' : 'Tenant'} • {conversation.property_title}
                      </div>

                      <div className="flex items-center justify-between">
                        {conversation.last_message ? (
                          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {conversation.last_message.sender_id === userId ? 'You: ' : ''}
                            {conversation.last_message.content}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                            No messages yet
                          </div>
                        )}
                        
                        {conversation.unread_count > 0 && (
                          <div className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )

              return (
                <li key={conversation.id}>
                  {onChatSelect ? (
                    conversationItem
                  ) : (
                    <Link href={href} className="block">
                      {conversationItem}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {userRole === 'tenant' 
                  ? 'Start a conversation by contacting a property agent from a listing.'
                  : 'Conversations will appear when tenants contact you about your properties.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
