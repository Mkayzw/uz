'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import MobileNavDrawer from '@/components/dashboard/MobileNavDrawer'
import MobileHeader from '@/components/dashboard/MobileHeader'
import MobileBottomNav from '@/components/dashboard/MobileBottomNav'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { useDocumentSwipe } from '@/hooks/useTouchGestures'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import PropertiesBrowser from '@/components/dashboard/PropertiesBrowser'
import AgentProperties from '@/components/dashboard/AgentProperties'
import DashboardApplications from '@/components/dashboard/DashboardApplications'
import SavedProperties from '@/components/dashboard/SavedProperties'
import DashboardAccount from '@/components/dashboard/DashboardAccount'
import CommissionTracking from '@/components/dashboard/CommissionTracking'
import ConfirmationModal from '@/components/ConfirmationModal'
import NotificationModal from '@/components/NotificationModal'
import ToastManager from '@/components/ToastManager'
import ImageModal from '@/components/ImageModal'
import ApplicationModal from '@/components/ApplicationModal'
import { useDashboardAuth } from '@/hooks/useDashboardAuth'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useRealTimeSubscriptions } from '@/hooks/useRealTimeSubscriptions'
import { useNavigationState } from '@/hooks/useNavigationState'
import { useSupabaseClient } from '@/hooks/useSupabaseClient'
import { updateApplicationStatus, verifyPayment, cancelApplication, submitApplication } from '@/app/dashboard/actions'
import {
  DashboardTab,
  NotificationModal as NotificationModalType,
  ConfirmationModal as ConfirmationModalType,
  ImageModal as ImageModalType,
  ApplicationModal as ApplicationModalType,
  Bed
} from '@/types/dashboard'
import {
  BellIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/react/24/solid'

export default function DashboardLayout() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use custom hooks for state management
  const { user, profile, loading: authLoading, error: authError, displayName, handleSignOut } = useDashboardAuth()
  const { navigateWithHistory, isBackNavigation } = useNavigationState()
  const {
    properties,
    allProperties,
    applications,
    agentApplications,
    savedProperties,
    loading: dataLoading,
    error: dataError,
    refreshData,
    setProperties,
    setAllProperties,
    setApplications,
    setAgentApplications,
    setSavedProperties
  } = useDashboardData({ user, profile })

  // Set up real-time subscriptions
  useRealTimeSubscriptions({
    user,
    profile,
    setProfile: () => {}, // Profile updates handled by auth hook
    setProperties,
    setAllProperties,
    setApplications,
    setAgentApplications,
    setSavedProperties
  })

  // Local state for UI
  const [activeTab, setActiveTab] = useState<DashboardTab>((searchParams.get('tab') as DashboardTab) || 'browse')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showBottomNav, setShowBottomNav] = useState(true) // Optional bottom nav
  const [applicationModal, setApplicationModal] = useState<ApplicationModalType>({
    isOpen: false,
    bedId: null
  })
  const [availableBeds, setAvailableBeds] = useState<any[]>([])

  // Modal states
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalType>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const [notificationModal, setNotificationModal] = useState<NotificationModalType>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  const [imageModal, setImageModal] = useState<ImageModalType>({
    isOpen: false,
    src: '',
    alt: '',
  })

  // Count for pending applications
  const pendingApplicationsCount = applications?.filter(app => app.status === 'pending')?.length || 0

  // Set default tab based on user role
  useEffect(() => {
    if (profile && !searchParams.get('tab')) {
      const defaultTab = profile.role === 'agent' ? 'properties' : 'browse'
      setActiveTab(defaultTab)
    }
  }, [profile, searchParams])

  // Add swipe gesture to open mobile menu
  useDocumentSwipe({
    onSwipeRight: () => {
      // Only open menu on swipe from left edge
      if (window.innerWidth < 1024) {
        setIsMobileMenuOpen(true)
      }
    },
    enabled: !isMobileMenuOpen && typeof window !== 'undefined' && window.innerWidth < 1024,
    threshold: 30
  })

  // Helper functions for modals
  const showConfirmation = (config: Omit<ConfirmationModalType, 'isOpen'>) => {
    setConfirmationModal({ ...config, isOpen: true })
  }

  const hideConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }))
  }

  const showNotification = (config: Omit<NotificationModalType, 'isOpen'>) => {
    setNotificationModal({ ...config, isOpen: true })
  }

  const hideNotification = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }))
  }

  const showImageModal = (src: string | null, alt: string) => {
    setImageModal({ isOpen: true, src: src || '', alt })
  }

  const hideImageModal = () => {
    setImageModal(prev => ({ ...prev, isOpen: false }))
  }

  // Loading and error states
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (authError || dataError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-blue-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {authError || dataError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">Please sign in to continue</div>
        </div>
      </div>
    )
  }

  // Action handlers
  const handleApplyToProperty = async (details: {
    registration_number: string
    national_id: string
    bed_id: string
    gender: string
  }) => {
    try {
      const result = await submitApplication(
        details.registration_number,
        details.national_id,
        details.bed_id,
        details.gender
      )
      if (result.data) {
        showNotification({
          title: 'Application Submitted',
          message: 'Your application has been submitted successfully.',
          type: 'success'
        })
        refreshData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      showNotification({
        title: 'Application Failed',
        message: error instanceof Error ? error.message : 'Failed to submit application',
        type: 'error'
      })
    }
  }

  const handleCancelApplication = async (applicationId: string) => {
    showConfirmation({
      title: 'Cancel Application',
      message: 'Are you sure you want to cancel this application? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const result = await cancelApplication(applicationId)
          if (result.data) {
            showNotification({
              title: 'Application Cancelled',
              message: 'Your application has been cancelled.',
              type: 'success'
            })
            refreshData()
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          showNotification({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to cancel application',
            type: 'error'
          })
        }
        hideConfirmation()
      }
    })
  }

  const handleSaveProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('saved_properties')
        .insert({ bed_id: propertyId, user_id: user.id })
      
      if (error) throw error
      
      showNotification({
        title: 'Property Saved',
        message: 'Property has been added to your saved list.',
        type: 'success'
      })
      refreshData()
    } catch (error) {
      showNotification({
        title: 'Error',
        message: 'Failed to save property',
        type: 'error'
      })
    }
  }

  const handleUnsaveProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('bed_id', propertyId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      showNotification({
        title: 'Property Removed',
        message: 'Property has been removed from your saved list.',
        type: 'success'
      })
      refreshData()
    } catch (error) {
      showNotification({
        title: 'Error',
        message: 'Failed to remove property',
        type: 'error'
      })
    }
  }

  // Render content based on active tab
  const renderContent = () => {
    const contentClasses = ""
    
    switch (activeTab) {
      case 'overview':
        return (
          <div className={contentClasses}>
            <DashboardOverview
              profile={profile}
              properties={properties}
              agentApplications={agentApplications}
              tenantApplications={applications}
              savedProperties={savedProperties}
              setActiveTab={setActiveTab}
              onBrowseProperties={() => setActiveTab('browse')}
            />
          </div>
        )
      
      case 'browse':
        return (
          <div className={contentClasses}>
            <PropertiesBrowser
              allProperties={allProperties}
              applications={applications}
              savedProperties={savedProperties}
              profile={profile}
              onApplyToProperty={(propertyId: string) => {
                setApplicationModal({ isOpen: true, bedId: propertyId })
              }}
              onCancelApplication={handleCancelApplication}
              onSaveProperty={handleSaveProperty}
              onUnsaveProperty={handleUnsaveProperty}
              onImageClick={showImageModal}
            />
          </div>
        )
      
      case 'properties':
        return (
          <div className={contentClasses}>
            <AgentProperties
              properties={properties}
              onImageClick={showImageModal}
            />
          </div>
        )
      
      case 'applications':
        return (
          <div className={contentClasses}>
            <DashboardApplications
              applications={applications}
              agentApplications={agentApplications}
              profile={profile}
              onApproveApplication={async (applicationId: string) => {
                try {
                  const result = await updateApplicationStatus(applicationId, 'approved')
                  if (result.data) {
                    showNotification({
                      title: 'Application Approved',
                      message: 'Application approved successfully.',
                      type: 'success'
                    })
                    refreshData()
                  } else {
                    throw new Error(result.error)
                  }
                } catch (error) {
                  showNotification({
                    title: 'Error',
                    message: error instanceof Error ? error.message : 'Failed to approve application',
                    type: 'error'
                  })
                }
              }}
              onRejectApplication={async (applicationId: string) => {
                try {
                  const result = await updateApplicationStatus(applicationId, 'rejected')
                  if (result.data) {
                    showNotification({
                      title: 'Application Rejected',
                      message: 'Application rejected successfully.',
                      type: 'success'
                    })
                    refreshData()
                  } else {
                    throw new Error(result.error)
                  }
                } catch (error) {
                  showNotification({
                    title: 'Error',
                    message: error instanceof Error ? error.message : 'Failed to reject application',
                    type: 'error'
                  })
                }
              }}
              onVerifyPayment={async (applicationId: string) => {
                try {
                  const result = await verifyPayment(applicationId)
                  if (result.data) {
                    showNotification({
                      title: 'Payment Verified',
                      message: 'Payment verified successfully.',
                      type: 'success'
                    })
                    refreshData()
                  } else {
                    throw new Error(result.error)
                  }
                } catch (error) {
                  showNotification({
                    title: 'Error',
                    message: error instanceof Error ? error.message : 'Failed to verify payment',
                    type: 'error'
                  })
                }
              }}
            />
          </div>
        )
      
      case 'saved':
        return (
          <div className={contentClasses}>
            <SavedProperties
              savedProperties={savedProperties}
              applications={applications}
              onApplyToProperty={(propertyId: string) => {
                setApplicationModal({ isOpen: true, bedId: propertyId })
              }}
              onCancelApplication={handleCancelApplication}
              onUnsaveProperty={handleUnsaveProperty}
              onImageClick={showImageModal}
              setActiveTab={setActiveTab}
            />
          </div>
        )
      
      case 'commission':
        return (
          <div className={contentClasses}>
            <CommissionTracking
              agentApplications={agentApplications}
            />
          </div>
        )
      
      case 'account':
        return (
          <div className={contentClasses}>
            <DashboardAccount
              user={user}
              profile={profile}
              onSignOut={handleSignOut}
              onUpdateEcocash={async (ecocashNumber: string) => {
                try {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ ecocash_number: ecocashNumber })
                    .eq('id', user.id)
                  
                  if (error) throw error
                  
                  showNotification({
                    title: 'Profile Updated',
                    message: 'EcoCash number updated successfully.',
                    type: 'success'
                  })
                  refreshData()
                } catch (error) {
                  showNotification({
                    title: 'Error',
                    message: 'Failed to update EcoCash number',
                    type: 'error'
                  })
                }
              }}
            />
          </div>
        )
      
      default:
        return (
          <div className={contentClasses}>
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Page not found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                The requested page could not be found.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        pendingApplicationsCount={pendingApplicationsCount}
      />

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={profile}
          pendingApplicationsCount={pendingApplicationsCount}
        />
      </div>

      {/* Main Content Area - responsive padding */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <MobileHeader
          onMenuClick={() => setIsMobileMenuOpen(true)}
          profile={profile}
          pendingApplicationsCount={pendingApplicationsCount}
          displayName={displayName}
        />

        {/* Desktop Header */}
        <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">UniStay</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <BellIcon className="w-6 h-6" />
                {pendingApplicationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingApplicationsCount > 9 ? '9+' : pendingApplicationsCount}
                  </span>
                )}
              </button>
              
              {/* User Menu */}
              <div className="flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                  {displayName}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Title (Below Header) - responsive padding */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 dark:border-gray-700">
          {activeTab === 'overview' ? (
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {profile?.full_name || (profile?.role === 'agent' ? 'Agent' : 'Student')}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                {profile?.role === 'agent'
                  ? 'Manage your property portfolio and client relationships'
                  : 'Find your perfect accommodation'
                }
              </p>
            </div>
          ) : (
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'browse' && 'Search & Browse Properties'}
              {activeTab === 'properties' && 'Property Management'}
              {activeTab === 'applications' && (profile?.role === 'agent' ? 'Application Reviews' : 'My Applications')}
              {activeTab === 'saved' && 'Saved Properties'}
              {activeTab === 'commission' && 'Commission Tracking'}
              {activeTab === 'account' && 'Profile & Settings'}
            </h1>
          )}
        </div>

        {/* Main Content - responsive padding and bottom spacing for mobile nav */}
        <main className={`flex-1 px-4 sm:px-6 lg:px-8 py-6 ${showBottomNav ? 'pb-24' : 'pb-6'} lg:pb-6 transition-all duration-300`}>
          {renderContent()}
        </main>
      </div>

      {/* Optional Mobile Bottom Navigation */}
      {showBottomNav && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={profile}
        />
      )}

      {/* Modals */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />

      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={hideNotification}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
      />

      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={hideImageModal}
        src={imageModal.src}
        alt={imageModal.alt}
      />

      <ApplicationModal
        isOpen={applicationModal.isOpen}
        onClose={() => setApplicationModal({ isOpen: false, bedId: null })}
        beds={availableBeds}
        onSubmit={handleApplyToProperty}
      />

      <ToastManager />
    </div>
  )
}
