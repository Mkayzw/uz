'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ChatList from '@/components/chat/ChatList'
import ChatWindow from '@/components/chat/ChatWindow'
import MessageInput from '@/components/chat/MessageInput'

export default function MessagesView() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get chat ID from URL params if available
  const urlChatId = searchParams.get('chatId')
  const activeChatId = selectedChatId || urlChatId

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
    setSidebarOpen(false) // Close sidebar on mobile when chat is selected
    
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('chatId', chatId)
    window.history.replaceState({}, '', url.toString())
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  const handleOpenSidebar = () => {
    setSidebarOpen(true)
  }

  return (
    <div className="h-[calc(100vh-200px)] bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="h-full flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <ChatList onChatSelect={handleChatSelect} />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="w-80 max-w-[85%] h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="h-full overflow-y-auto">
                <ChatList onChatSelect={handleChatSelect} />
              </div>
            </div>
            <div
              className="flex-1 h-full bg-black/40 backdrop-blur-sm"
              onClick={handleCloseSidebar}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeChatId ? (
            <>
              <ChatWindow 
                chatId={activeChatId} 
                onOpenSidebar={handleOpenSidebar}
                className="flex-1"
              />
              <MessageInput 
                chatId={activeChatId}
                className="border-t border-gray-200 dark:border-gray-700"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                {/* Desktop empty state */}
                <div className="hidden lg:block">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Welcome to Messages</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select a conversation to start chatting</p>
                </div>

                {/* Mobile empty state */}
                <div className="lg:hidden">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Messages</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">View and manage your conversations</p>
                  <button
                    onClick={handleOpenSidebar}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
                    </svg>
                    View Conversations
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}