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
    <form onSubmit={handleSubmit} className="p-4 border-t flex">
      <input
        type="text"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border rounded px-2 py-1"
      />
      <button type="submit" className="ml-2 px-4 py-1 bg-blue-600 text-white rounded">
        Send
      </button>
    </form>
  )
}
