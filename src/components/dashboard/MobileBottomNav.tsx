'use client'

import { UserProfile, DashboardTab } from '@/types/dashboard'
import {
  MagnifyingGlassIcon,
  HeartIcon,
  UserCircleIcon,
  HomeIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline'
import {
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  HeartIcon as HeartIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  HomeIcon as HomeIconSolid,
  PlusCircleIcon as PlusCircleIconSolid
} from '@heroicons/react/24/solid'

interface MobileBottomNavProps {
  activeTab: DashboardTab
  setActiveTab: (tab: DashboardTab) => void
  profile: UserProfile | null
}

interface QuickNavItem {
  id: DashboardTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
}

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  profile
}: MobileBottomNavProps) {
  // Define quick access navigation items
  const quickNavItems: QuickNavItem[] = [
    {
      id: 'overview',
      label: 'Home',
      icon: HomeIcon,
      iconSolid: HomeIconSolid
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid
    },
    {
      id: profile?.role === 'agent' ? 'properties' : 'applications',
      label: profile?.role === 'agent' ? 'Add' : 'Apply',
      icon: PlusCircleIcon,
      iconSolid: PlusCircleIconSolid
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: HeartIcon,
      iconSolid: HeartIconSolid
    },
    {
      id: 'account',
      label: 'Profile',
      icon: UserCircleIcon,
      iconSolid: UserCircleIconSolid
    }
  ]

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    // Update URL without navigation
    window.history.replaceState(null, '', `/dashboard?tab=${tab}`)
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-area-inset">
      <nav className="flex justify-around items-center h-16 px-2">
        {quickNavItems.map((item) => {
          const Icon = activeTab === item.id ? item.iconSolid : item.icon
          const isActive = activeTab === item.id
          const isCenter = item.label === 'Add' || item.label === 'Apply'

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`
                relative flex flex-col items-center justify-center flex-1 h-full touch-manipulation
                ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
                ${!isCenter ? 'hover:text-blue-600 dark:hover:text-blue-400' : ''}
                transition-colors duration-200
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isCenter ? (
                <div className="absolute -top-2 bg-blue-600 dark:bg-blue-500 rounded-full p-3 shadow-lg transform hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}