import Link from 'next/link'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface DashboardHeaderProps {
  onSignOut: () => void
}

export default function DashboardHeader({ onSignOut }: DashboardHeaderProps) {
  return (
    <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-500">
                UniStay
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Dashboard</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link
              href="/support"
              className="inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            >
              <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
              Support
            </Link>
            <button
              onClick={onSignOut}
              className="inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
