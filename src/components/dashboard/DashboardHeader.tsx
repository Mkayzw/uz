import ThemeToggle from '@/components/ThemeToggle'

interface DashboardHeaderProps {
  onSignOut: () => void
}

export default function DashboardHeader({ onSignOut }: DashboardHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">UniStay</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={onSignOut}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
