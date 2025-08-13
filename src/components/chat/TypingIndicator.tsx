'use client'

interface TypingIndicatorProps {
  isTyping: boolean
  userName?: string
  className?: string
}

export default function TypingIndicator({ 
  isTyping, 
  userName = 'Someone', 
  className = '' 
}: TypingIndicatorProps) {
  if (!isTyping) return null

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {userName} is typing...
      </span>
    </div>
  )
}