'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import useChat from './hooks/useChat'

interface ChatWindowProps {
  chatId: string
}

interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'agent'
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const { messages } = useChat(chatId)
  const [participants, setParticipants] = useState<Record<string, UserProfile>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch participants when component mounts
  useEffect(() => {
    async function fetchParticipants() {
      console.log('ChatWindow: Fetching participants for chatId:', chatId)
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      console.log('ChatWindow: Current user ID:', userId)
      setCurrentUserId(userId || null)

      // Get chat participants
      const { data: chatParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)

      console.log('ChatWindow: Chat participants:', chatParticipants)
      console.log('ChatWindow: Participants error:', participantsError)

      if (chatParticipants && chatParticipants.length > 0) {
        const userIds = chatParticipants.map(p => p.user_id)
        console.log('ChatWindow: User IDs to fetch profiles for:', userIds)
        
        // Fetch profiles for all participants
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', userIds)

        console.log('ChatWindow: Fetched profiles:', profiles)
        console.log('ChatWindow: Profiles error:', profilesError)

        if (profiles) {
          const participantMap: Record<string, UserProfile> = {}
          profiles.forEach(profile => {
            participantMap[profile.id] = profile
          })
          console.log('ChatWindow: Participant map:', participantMap)
          setParticipants(participantMap)
        }
      } else {
        console.log('ChatWindow: No chat participants found')
      }
    }

    if (chatId) {
      fetchParticipants()
    }
  }, [chatId])

  // scroll to bottom on new messages
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
    const participant = participants[senderId]
    if (!participant) return { name: 'Loading...', role: '' }
    
    return {
      name: participant.full_name || 'Unknown User',
      role: participant.role === 'agent' ? 'Property Owner' : 'Tenant'
    }
  }

  const getOtherParticipant = () => {
    const otherParticipantId = Object.keys(participants).find(id => id !== currentUserId)
    return otherParticipantId ? participants[otherParticipantId] : null
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      {otherParticipant && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {(otherParticipant.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {otherParticipant.full_name || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {otherParticipant.role === 'agent' ? 'Property Owner' : 'Tenant'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(msg => {
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
      })}
       <div ref={bottomRef} />
      </div>
    </div>
  )
}
