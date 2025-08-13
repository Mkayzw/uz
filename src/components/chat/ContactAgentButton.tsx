'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChatList, useCurrentUser } from '@/lib/chat/hooks'
import { formatErrorForUser } from '@/lib/chat/errors'

interface ContactAgentButtonProps {
  propertyId: string
  agentId: string
  propertyTitle: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export default function ContactAgentButton({
  propertyId,
  agentId,
  propertyTitle,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}: ContactAgentButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createChat } = useChatList()
  const { userId, loading: userLoading } = useCurrentUser()
  const router = useRouter()

  const handleContactAgent = async () => {
    if (isCreating || disabled) return

    // If user is not authenticated, redirect to signup with intent to contact agent
    if (!userId) {
      // Store the property info for after authentication
      if (typeof window !== 'undefined') {
        localStorage.setItem('contact_agent_after_auth', JSON.stringify({
          propertyId,
          agentId,
          propertyTitle
        }))
      }
      router.push('/auth/signup?intent=contact')
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      // Create or get existing chat
      const chatId = await createChat(propertyId)
      
      // Navigate to the chat
      router.push(`/chat/${chatId}`)
    } catch (err) {
      console.error('Failed to create chat:', err)
      setError(formatErrorForUser(err))
    } finally {
      setIsCreating(false)
    }
  }

  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const variantStyles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-sm hover:shadow-md',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500'
    }
    
    const disabledStyles = 'opacity-50 cursor-not-allowed'
    
    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
      (disabled || isCreating) ? disabledStyles : ''
    } ${className}`
  }

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className={getButtonStyles()}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
          Loading...
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleContactAgent}
        disabled={disabled || isCreating}
        className={getButtonStyles()}
        aria-label={userId ? `Contact agent about ${propertyTitle}` : `Sign up to contact agent about ${propertyTitle}`}
      >
        {isCreating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Creating chat...
          </>
        ) : userId ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.41-1.824L3 21l2.824-3.59A9.013 9.013 0 013 12c0-4.97 4.029-9 9-9s9 4.03 9 9z" />
            </svg>
            Contact Agent
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Sign Up to Contact
          </>
        )}
      </button>
      
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}