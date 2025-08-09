'use client'

import { ReactNode } from 'react'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  if (!open) return null
  return (
    <div className="sm:hidden fixed inset-0 z-50 flex">
      <div className="w-80 max-w-[80%] h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="h-full overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
      <div
        className="flex-1 h-full bg-black/40 backdrop-blur-supported"
        onClick={onClose}
      />
    </div>
  )
}

