'use client'

import { useEffect } from 'react'
import Modal from './Modal'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  icon?: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export default function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  icon,
  autoClose = false,
  autoCloseDelay = 3000
}: NotificationModalProps) {
  // Auto close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  const typeStyles = {
    success: {
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    error: {
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const currentStyle = typeStyles[type]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${currentStyle.iconBg} mb-4`}>
          <span className={`text-2xl ${currentStyle.iconColor}`}>
            {icon || (type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️')}
          </span>
        </div>
        
        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-900 dark:text-white whitespace-pre-line">
            {message}
          </p>
        </div>
        
        {/* Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 border border-transparent rounded-md text-white ${currentStyle.button} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}
