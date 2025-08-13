'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChatList, useCurrentUser } from '@/lib/chat/hooks'

/**
 * Component to handle chat creation after user authentication
 * Should be placed in the dashboard or main app layout
 */
export default function PostAuthChatHandler() {
  const { createChat } = useChatList()
  const { userId } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (!userId) return

    const handlePostAuthChat = async () => {
      try {
        // Check if there's a pending contact agent request
        const contactAgentData = localStorage.getItem('contact_agent_after_auth')
        if (contactAgentData) {
          const { propertyId, propertyTitle } = JSON.parse(contactAgentData)
          
          // Clear the stored data
          localStorage.removeItem('contact_agent_after_auth')
          
          // Create the chat
          const chatId = await createChat(propertyId)
          
          // Navigate to the chat
          router.push(`/chat/${chatId}`)
        }
      } catch (error) {
        console.error('Failed to create post-auth chat:', error)
        // Could show a toast notification here
      }
    }

    handlePostAuthChat()
  }, [userId, createChat, router])

  // This component doesn't render anything
  return null
}