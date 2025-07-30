'use client'

import { useEffect } from 'react'
import Modal from './Modal'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

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
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    error: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    warning: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const currentStyle = typeStyles[type]

  const getIcon = () => {
    if (icon) {
      return <span className={`text-2xl ${currentStyle.iconColor}`}>{icon}</span>
    }

    const iconClass = `w-6 h-6 ${currentStyle.iconColor}`

    switch (type) {
      case 'success':
        return <CheckCircleIcon className={iconClass} />
      case 'error':
        return <XCircleIcon className={iconClass} />
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />
      case 'info':
      default:
        return <InformationCircleIcon className={iconClass} />
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${currentStyle.iconBg} mb-4`}>
          {getIcon()}
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
