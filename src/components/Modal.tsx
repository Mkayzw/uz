'use client'

import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Mobile: Full screen modal */}
      {/* Desktop: Centered modal with backdrop */}
      <div className="flex min-h-screen sm:items-center sm:justify-center sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal - Full screen on mobile, centered on desktop */}
        <div className={`relative bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:rounded-lg shadow-xl ${sizeClasses[size]} transform transition-all sm:mx-auto`}>
          {/* Header - Sticky on mobile for better UX */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white pr-2">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 -m-2 touch-manipulation"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content - Scrollable on mobile */}
          <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>
            {children}
          </div>
          
          {/* Safe area padding for mobile devices with notches/home indicators */}
          <div className="sm:hidden h-safe-area-inset-bottom" />
        </div>
      </div>
    </div>
  )
}
