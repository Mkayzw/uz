'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ChatList from '@/components/chat/ChatList'
import ChatWindow from '@/components/chat/ChatWindow'
import MessageInput from '@/components/chat/MessageInput'
import { useDocumentSwipe } from '@/hooks/useTouchGestures'
import MobileDrawer from '@/components/chat/MobileDrawer'
import { usePathname } from 'next/navigation'

export default function ChatPage() {
  const params = useParams()
  const pathname = usePathname()
  const chatId = (params?.chatId as string) || ''
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Swipe gestures only on small screens
  useDocumentSwipe({
    onSwipeRight: () => setSidebarOpen(true),
    onSwipeLeft: () => setSidebarOpen(false),
    threshold: 60,
    enabled: typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : true,
  })

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden sm:block w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatList />
      </aside>

      {/* Mobile drawer sidebar */}
      <MobileDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <ChatList />
      </MobileDrawer>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {chatId ? (
          <>
            <ChatWindow chatId={chatId} onOpenSidebar={() => setSidebarOpen(true)} />
            <MessageInput chatId={chatId} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="mb-4 hidden sm:block">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 hidden sm:block">Select a conversation</h3>
              <p className="text-sm hidden sm:block">Choose a chat from the sidebar to start messaging</p>
              {/* On mobile, prompt to open chats */}
              <button
                type="button"
                className="sm:hidden mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white"
                onClick={() => setSidebarOpen(true)}
              >
                Open chats
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
