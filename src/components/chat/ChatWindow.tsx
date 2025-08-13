'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useChat, useCurrentUser } from '@/lib/chat/hooks'
import { formatErrorForUser } from '@/lib/chat/errors'
import { Message } from '@/lib/chat/types'

interface ChatWindowProps {
  chatId: string
  onOpenSidebar?: () => void
  className?: string
}

export default function ChatWindow({ chatId, onOpenSidebar, className = '' }: ChatWindowProps) {
  const { messages, chatDetails, loading, error } = useChat(chatId)
  const { userId: currentUserId } = useCurrentUser()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Group messages by date for better organization
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    )
  }, [messages])

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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const isConsecutiveMessage = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return false
    
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
    const fiveMinutes = 5 * 60 * 1000
    
    return currentMsg.sender_id === prevMsg.sender_id && timeDiff < fiveMinutes
  }

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Loading conversation...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center p-4 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-red-600 dark:text-red-400 font-medium mb-2">
            {formatErrorForUser(error)}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!chatDetails) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
            </svg>
          </div>
          <div className="text-gray-600 dark:text-gray-400">Chat not found</div>
        </div>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      {/* Chat Header */}
      {otherParticipant && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            {/* Mobile: hamburger menu */}
            {onOpenSidebar && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="sm:hidden p-2 -ml-2 mr-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                aria-label="Open chat list"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">
                {(otherParticipant.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {otherParticipant.full_name || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {otherParticipant.role === 'agent' ? 'Property Agent' : 'Tenant'}
              </p>
            </div>

            {/* Online status indicator (placeholder for future implementation) */}
            <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
          </div>
          
          {/* Property context */}
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 truncate">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {chatDetails.property_title}
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupedMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start the conversation</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Send a message to begin chatting about {chatDetails.property_title}
              </p>
            </div>
          </div>
        ) : (
          groupedMessages.map(([date, dayMessages]) => (
            <div key={date} className="space-y-4">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {formatDateHeader(date)}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              {dayMessages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUserId
                const prevMessage = index > 0 ? dayMessages[index - 1] : null
                const isConsecutive = isConsecutiveMessage(message, prevMessage)

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                      isConsecutive ? 'mt-1' : 'mt-4'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      } ${
                        isConsecutive
                          ? isCurrentUser
                            ? 'rounded-tr-md'
                            : 'rounded-tl-md'
                          : ''
                      }`}
                    >
                      <div className="text-sm leading-relaxed">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isCurrentUser
                            ? 'text-blue-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        
        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
