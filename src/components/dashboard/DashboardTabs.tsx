import { DashboardTab, UserProfile } from '@/types/dashboard'
import { useState, useRef, useEffect } from 'react'

interface DashboardTabsProps {
  activeTab: DashboardTab
  setActiveTab: (tab: DashboardTab) => void
  profile: UserProfile | null
}

export default function DashboardTabs({ activeTab, setActiveTab, profile }: DashboardTabsProps) {
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const tabs = [
    { id: 'overview' as DashboardTab, label: 'Overview', show: true },
    { id: 'browse' as DashboardTab, label: 'Browse Properties', show: true },
    { 
      id: 'properties' as DashboardTab, 
      label: 'My Properties', 
      show: profile?.role === 'agent' && profile?.agent_status === 'active' 
    },
    { id: 'applications' as DashboardTab, label: 'Applications', show: true },
    { 
      id: 'saved' as DashboardTab, 
      label: 'Saved Properties', 
      show: profile?.role === 'tenant' 
    },
    { id: 'messages' as DashboardTab, label: 'Messages', show: true },
    { id: 'account' as DashboardTab, label: 'Account', show: true },
    { 
      id: 'commission' as DashboardTab, 
      label: 'Commission Tracking', 
      show: profile?.role === 'agent' && profile?.agent_status === 'active' 
    }
  ].filter(tab => tab.show)

  // Check scroll position for gradient indicators
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftGradient(scrollLeft > 0)
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [tabs])

  // Scroll to active tab on mount and when active tab changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector(`[data-tab="${activeTab}"]`)
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeTab])

  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile Tab Navigation - Horizontal scrollable with touch support */}
      <div className="sm:hidden relative">
        <div className="relative">
          {/* Left gradient indicator */}
          {showLeftGradient && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
          )}
          
          {/* Right gradient indicator */}
          {showRightGradient && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
          )}

          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700"
            onScroll={checkScroll}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch' 
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm flex-shrink-0 touch-manipulation min-h-[48px]`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden sm:block">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
