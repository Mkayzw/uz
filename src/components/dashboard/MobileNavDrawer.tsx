'use client'

import { Fragment, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { UserProfile, DashboardTab } from '@/types/dashboard'
import { useTouchGestures } from '@/hooks/useTouchGestures'
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  HeartIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import {
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  HeartIcon as HeartIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  HomeIcon as HomeIconSolid,
} from '@heroicons/react/24/solid'

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
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
  badge?: number
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  profile,
  pendingApplicationsCount = 0
}: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Add swipe to close gesture
  useTouchGestures(panelRef, {
    onSwipeLeft: onClose,
    threshold: 50,
    enabled: isOpen
  })

  // Define navigation items based on user role
  const tenantNavigation: NavigationItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      show: true,
    },
    {
      id: 'browse',
      label: 'Browse Properties',
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      show: true,
    },
    {
      id: 'applications',
      label: 'My Applications',
      icon: DocumentTextIcon,
      iconSolid: DocumentTextIconSolid,
      show: true,
      badge: pendingApplicationsCount
    },
    {
      id: 'saved',
      label: 'Saved Properties',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
      show: true
    },
    {
      id: 'account',
      label: 'Account Settings',
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
    },
    {
      id: 'properties',
      label: 'My Properties',
      icon: BuildingOfficeIcon,
      iconSolid: BuildingOfficeIconSolid,
      show: profile?.role === 'agent' && profile?.agent_status === 'active',
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardDocumentListIconSolid,
      show: profile?.role === 'agent' && profile?.agent_status === 'active',
      badge: pendingApplicationsCount
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
      label: 'Account Settings',
      icon: UserCircleIcon,
      iconSolid: UserCircleIconSolid,
      show: true
    }
  ]

  const navigation = profile?.role === 'agent' ? agentNavigation : tenantNavigation
  const visibleNavigation = navigation.filter(item => item.show)

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    onClose()
    // Update URL without navigation
    window.history.replaceState(null, '', `/dashboard?tab=${tab}`)
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel ref={panelRef} className="relative mr-16 flex w-full max-w-xs flex-1 transform transition-transform duration-300 ease-in-out">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 touch-manipulation"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>

              {/* Sidebar component */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4 smooth-scroll">
                {/* Header */}
                <div className="flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-700">
                  <HomeIconSolid className="w-8 h-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">UniStay</span>
                </div>

                {/* User Profile Section */}
                <div className="flex items-center px-2 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <UserCircleIconSolid className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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

                {/* Navigation */}
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-2">
                    {visibleNavigation.map((item) => {
                      const Icon = activeTab === item.id ? item.iconSolid : item.icon
                      const isActive = activeTab === item.id
                      
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleTabChange(item.id)}
                            className={`
                              w-full group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 touch-manipulation min-h-[48px]
                              transition-all duration-200 transform active:scale-95
                              ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                              }
                            `}
                          >
                            <Icon
                              className={`h-6 w-6 shrink-0 ${
                                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <span className="ml-auto w-9 min-w-max whitespace-nowrap rounded-full bg-blue-600 dark:bg-blue-500 px-2.5 py-0.5 text-center text-xs font-medium leading-5 text-white">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </nav>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    © 2025 UniStay Platform
                  </p>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}