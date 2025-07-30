'use client'

import { useState } from 'react'
import { UserProfile } from '@/types/dashboard'
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'

interface MessagesViewProps {
  profile: UserProfile | null
  unreadCount?: number
}

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'agent' | 'tenant' | 'system'
}

interface Conversation {
  id: string
  participantName: string
  participantRole: 'agent' | 'tenant'
  lastMessage: string
  timestamp: string
  unreadCount: number
  propertyTitle?: string
}

export default function MessagesView({ profile, unreadCount = 0 }: MessagesViewProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newMessage, setNewMessage] = useState('')

  // Mock data - replace with real data from your API
  const conversations: Conversation[] = [
    {
      id: '1',
      participantName: 'John Smith',
      participantRole: 'agent',
      lastMessage: 'The property is available for viewing this weekend.',
      timestamp: '2025-07-30T10:30:00Z',
      unreadCount: 2,
      propertyTitle: 'Modern Apartment Downtown'
    },
    {
      id: '2',
      participantName: 'Sarah Johnson',
      participantRole: 'tenant',
      lastMessage: 'Thank you for your application. We will review it shortly.',
      timestamp: '2025-07-30T09:15:00Z',
      unreadCount: 0,
      propertyTitle: 'Cozy Studio Near Campus'
    },
    {
      id: '3',
      participantName: 'System',
      participantRole: 'agent',
      lastMessage: 'Your application has been approved!',
      timestamp: '2025-07-29T16:45:00Z',
      unreadCount: 1
    }
  ]

  const messages: Message[] = [
    {
      id: '1',
      sender: 'John Smith',
      content: 'Hi! I see you\'re interested in the Modern Apartment Downtown. Would you like to schedule a viewing?',
      timestamp: '2025-07-30T10:00:00Z',
      isRead: true,
      type: 'agent'
    },
    {
      id: '2',
      sender: 'You',
      content: 'Yes, I would love to see it. When would be a good time?',
      timestamp: '2025-07-30T10:15:00Z',
      isRead: true,
      type: 'tenant'
    },
    {
      id: '3',
      sender: 'John Smith',
      content: 'The property is available for viewing this weekend. Saturday or Sunday would work best.',
      timestamp: '2025-07-30T10:30:00Z',
      isRead: false,
      type: 'agent'
    }
  ]

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // TODO: Implement send message functionality
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Messages
          </h2>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`w-full p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                selectedConversation === conversation.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.participantName}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(conversation.timestamp)}
                    </span>
                  </div>
                  {conversation.propertyTitle && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      {conversation.propertyTitle}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conversation.lastMessage}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {conversation.unreadCount} new
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {conversations.find(c => c.id === selectedConversation)?.participantName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {conversations.find(c => c.id === selectedConversation)?.propertyTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'You'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'You'
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No conversation selected
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
