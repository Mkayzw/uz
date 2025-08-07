'use client'

import { useParams } from 'next/navigation'
import ChatList from '@/components/chat/ChatList'
import ChatWindow from '@/components/chat/ChatWindow'
import MessageInput from '@/components/chat/MessageInput'

export default function ChatIndexPage() {
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      <aside className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatList />
      </aside>
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Welcome to Messages</h3>
          <p className="text-sm">Select a conversation to start chatting</p>
        </div>
      </div>
    </div>
  )
}
