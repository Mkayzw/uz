'use client'

import { useState, useCallback } from 'react'
import ToastNotification from './ToastNotification'

interface Toast {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  actionButton?: {
    text: string
    onClick: () => void
  }
}

interface ToastManagerProps {
  onToastAdd?: (toast: Toast) => void
}

let toastManagerInstance: {
  addToast: (toast: Omit<Toast, 'id'>) => void
} | null = null

export function useToast() {
  return {
    addToast: (toast: Omit<Toast, 'id'>) => {
      if (toastManagerInstance) {
        toastManagerInstance.addToast(toast)
      }
    }
  }
}

export default function ToastManager({ onToastAdd }: ToastManagerProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])
    onToastAdd?.(newToast)
  }, [onToastAdd])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Set the global instance
  toastManagerInstance = { addToast }

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(${index * 80}px)`,
            zIndex: 1000 - index
          }}
        >
          <ToastNotification
            {...toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  )
}
