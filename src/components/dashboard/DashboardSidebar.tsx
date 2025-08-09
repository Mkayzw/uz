'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserProfile, DashboardTab } from '@/types/dashboard'
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BellIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline'
import {
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  HeartIcon as HeartIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  HomeIcon as HomeIconSolid,
  BellIcon as BellIconSolid,
  ReceiptPercentIcon as ReceiptPercentIconSolid
} from '@heroicons/react/24/solid'

interface DashboardSidebarProps {
  activeTab: DashboardTab
  setActiveTab: (tab: DashboardTab) => void
  profile: UserProfile | null
  pendingApplicationsCount?: number
}

interface NavigationItem {
  id: DashboardTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
  show: boolean
  isPrimary?: boolean
  badge?: number
  description?: string
}

export default function DashboardSidebar({ 
  activeTab, 
  setActiveTab, 
  profile,
  pendingApplicationsCount = 0
}: DashboardSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [clientSideCount, setClientSideCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  
  // Use useEffect to sync the pendingApplicationsCount on the client side only
  // This prevents hydration mismatches
  useEffect(() => {
    setClientSideCount(pendingApplicationsCount)
  }, [pendingApplicationsCount])

  // Define navigation items based on user role
  const tenantNavigation: NavigationItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      show: true,
      isPrimary: true,
      description: 'Your dashboard overview'
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      show: true,
      description: 'Find your perfect accommodation'
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: DocumentTextIcon,
      iconSolid: DocumentTextIconSolid,
      show: true,
      badge: clientSideCount
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
      show: true
    },
    
    {
      id: 'account',
      label: 'Account',
      icon: UserCircleIcon,
      iconSolid: UserCircleIconSolid,
      show: true
    }
  ]

  const agentNavigation: NavigationItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      show: true,
      isPrimary: true,
      description: 'Your dashboard overview'
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: BuildingOfficeIcon,
      iconSolid: BuildingOfficeIconSolid,
      show: profile?.role === 'agent' && profile?.agent_status === 'active',
      description: 'Manage your property listings'
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardDocumentListIconSolid,
      show: profile?.role === 'agent' && profile?.agent_status === 'active',
      badge: clientSideCount
    },
    {
      id: 'commission',
      label: 'Commission',
      icon: CurrencyDollarIcon,
      iconSolid: CurrencyDollarIconSolid,
      show: profile?.role === 'agent' && profile?.agent_status === 'active'
    },
    {
      id: 'account',
      label: 'Account',
      icon: UserCircleIcon,
      iconSolid: UserCircleIconSolid,
      show: true
    }
  ]

  const navigation = profile?.role === 'agent' ? agentNavigation : tenantNavigation
  const visibleNavigation = navigation.filter(item => item.show)

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
    // Update URL without navigation
    window.history.replaceState(null, '', `/dashboard?tab=${tab}`)
  }

  return (
    <>
      {/* Desktop Sidebar - Only visible on large screens */}
      <div className="flex flex-col w-72 fixed inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <HomeIconSolid className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">UniStay</span>
          </div>

          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <UserCircleIconSolid className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {profile?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const Icon = activeTab === item.id ? item.iconSolid : item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`
                    w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                    ${item.isPrimary ? 'ring-2 ring-blue-100 dark:ring-blue-900/30' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  
                  {/* Badge for unread counts */}
                  {item.badge && item.badge > 0 && (
                    <span suppressHydrationWarning className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}

                  {/* Primary indicator */}
                  {item.isPrimary && (
                    <div className="ml-2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2025 UniStay Platform
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
