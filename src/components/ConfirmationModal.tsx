'use client'

import Modal from './Modal'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  icon?: string
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const typeStyles = {
    danger: {
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
    },
    success: {
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    }
  }

  const currentStyle = typeStyles[type]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${currentStyle.iconBg} mb-4`}>
          <span className={`text-2xl ${currentStyle.iconColor}`}>
            {icon || (type === 'danger' ? '⚠️' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️')}
          </span>
        </div>
        
        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-900 dark:text-white whitespace-pre-line">
            {message}
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 border border-transparent rounded-md text-white ${currentStyle.button} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
