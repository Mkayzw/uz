'use client'

import { useState, FormEvent } from 'react'
import useChat from './hooks/useChat'

interface MessageInputProps {
  chatId: string
}

export default function MessageInput({ chatId }: MessageInputProps) {
  const { sendMessage, userId } = useChat(chatId)
  const [content, setContent] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !userId) return
    await sendMessage(content.trim())
    setContent('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-supported safe-area-inset"
    >
      <input
        type="text"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-3 text-sm sm:text-base dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="shrink-0 inline-flex items-center justify-center px-4 sm:px-5 py-3 min-w-[var(--touch-target-min)] min-h-[var(--touch-target-min)] rounded-full bg-blue-600 text-white disabled:opacity-50"
      >
        Send
      </button>
    </form>
  )
}
