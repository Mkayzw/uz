'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatList from './ChatList'
import ChatWindow from './ChatWindow'
import MessageInput from './MessageInput'

interface MobileChatInterfaceProps {
  initialChatId?: string | null
}

export default function MobileChatInterface({ initialChatId }: MobileChatInterfaceProps) {
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null)
  const router = useRouter()

  // Handle initial chat ID
  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId)
      setCurrentView('chat')
    }
  }, [initialChatId])

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
    setCurrentView('chat')
    
    // Update URL
    router.push(`/chat/${chatId}`)
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedChatId(null)
    
    // Update URL
    router.push('/chat')
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {currentView === 'list' ? (
        <div className="flex-1 bg-white dark:bg-gray-800">
          <ChatList onChatSelect={handleChatSelect} />
        </div>
      ) : selectedChatId ? (
        <>
          <ChatWindow 
            chatId={selectedChatId} 
            onOpenSidebar={handleBackToList}
            className="flex-1"
          />
          <MessageInput 
            chatId={selectedChatId}
            className="border-t border-gray-200 dark:border-gray-700"
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">No chat selected</div>
            <button
              onClick={handleBackToList}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to conversations
            </button>
          </div>
        </div>
      )}
    </div>
  )
}