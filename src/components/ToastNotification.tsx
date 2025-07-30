'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface ToastNotificationProps {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  actionButton?: {
    text: string
    onClick: () => void
  }
  onClose: (id: string) => void
}

export default function ToastNotification({
  id,
  title,
  message,
  type,
  duration = 5000,
  actionButton,
  onClose
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-blue-500 border-blue-600'
      case 'error':
        return 'bg-blue-500 border-blue-600'
      case 'warning':
        return 'bg-blue-500 border-blue-600'
      case 'info':
      default:
        return 'bg-blue-500 border-blue-600'
    }
  }

  const getIcon = () => {
    const iconClass = "w-5 h-5 text-white"

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
    <div
      className={`fixed top-4 right-4 max-w-sm w-full bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
        isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      } ${getTypeStyles()}`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
            {actionButton && (
              <div className="mt-3">
                <button
                  onClick={actionButton.onClick}
                  className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                >
                  {actionButton.text}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className="bg-white dark:bg-gray-700 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
