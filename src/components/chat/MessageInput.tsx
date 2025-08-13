'use client'

import { useState, useRef, useEffect, KeyboardEvent, FormEvent } from 'react'
import { useChat } from '@/lib/chat/hooks'
import { formatErrorForUser } from '@/lib/chat/errors'

interface MessageInputProps {
  chatId: string
  className?: string
  placeholder?: string
  disabled?: boolean
}

const MAX_MESSAGE_LENGTH = 1000

export default function MessageInput({ 
  chatId, 
  className = '', 
  placeholder = 'Type a message...',
  disabled = false 
}: MessageInputProps) {
  const { sendMessage, sending, error } = useChat(chatId)
  const [content, setContent] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [content])

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await sendMessageHandler()
  }

  const sendMessageHandler = async () => {
    const trimmedContent = content.trim()
    
    if (!trimmedContent || sending || disabled) return
    
    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      setLocalError(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`)
      return
    }

    try {
      setLocalError(null)
      await sendMessage(trimmedContent)
      setContent('')
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setLocalError(formatErrorForUser(err))
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessageHandler()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Clear local error when user starts typing
    if (localError) {
      setLocalError(null)
    }
    
    // Prevent input beyond max length
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setContent(value)
    }
  }

  const currentError = localError || error
  const isDisabled = disabled || sending
  const canSend = content.trim().length > 0 && !isDisabled

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
      {/* Error message */}
      {currentError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-600 dark:text-red-400">{currentError}</span>
            <button
              onClick={() => setLocalError(null)}
              className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-3">
          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isDisabled ? 'Sending...' : placeholder}
              disabled={isDisabled}
              rows={1}
              className={`w-full resize-none border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            
            {/* Character count */}
            {content.length > MAX_MESSAGE_LENGTH * 0.8 && (
              <div className={`absolute bottom-2 right-12 text-xs ${
                content.length > MAX_MESSAGE_LENGTH 
                  ? 'text-red-500' 
                  : content.length > MAX_MESSAGE_LENGTH * 0.9 
                    ? 'text-yellow-500' 
                    : 'text-gray-400'
              }`}>
                {content.length}/{MAX_MESSAGE_LENGTH}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!canSend}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              canSend
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {sending && (
            <span className="flex items-center space-x-1">
              <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Sending...</span>
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
