'use client'

import { useRouter } from 'next/navigation'
import { useNavigationState } from '@/hooks/useNavigationState'

interface BackButtonProps {
  fallbackPath?: string
  className?: string
  children?: React.ReactNode
}

export default function BackButton({ 
  fallbackPath = '/dashboard', 
  className = '',
  children 
}: BackButtonProps) {
  const router = useRouter()
  const { goBack, historyLength } = useNavigationState()

  const handleBack = () => {
    if (historyLength > 1) {
      goBack()
    } else {
      // Fallback to specified path if no history
      router.push(fallbackPath)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
    >
      <svg 
        className="w-4 h-4 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 19l-7-7 7-7" 
        />
      </svg>
      {children || 'Back'}
    </button>
  )
}
