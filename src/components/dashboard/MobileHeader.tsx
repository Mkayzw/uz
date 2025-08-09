'use client'

import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import { UserProfile } from '@/types/dashboard'

interface MobileHeaderProps {
  onMenuClick: () => void
  profile: UserProfile | null
  pendingApplicationsCount?: number
  displayName: string
}

export default function MobileHeader({
  onMenuClick,
  profile,
  pendingApplicationsCount = 0,
  displayName
}: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 shadow-sm">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg active:scale-95"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="h-6 w-6 transition-transform duration-200" aria-hidden="true" />
      </button>

      {/* Logo */}
      <div className="flex flex-1 items-center gap-x-4">
        <div className="flex items-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white">UniStay</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-x-2">
        {/* Notifications */}
        <button
          className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg active:scale-95"
          aria-label="View notifications"
        >
          <BellIcon className="h-6 w-6 transition-transform duration-200" />
          {pendingApplicationsCount > 0 && (
            <span className="absolute top-1 right-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
              {pendingApplicationsCount > 9 ? '9+' : pendingApplicationsCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center">
          <button className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center transition-all duration-200 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 dark:hover:ring-offset-gray-900">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}