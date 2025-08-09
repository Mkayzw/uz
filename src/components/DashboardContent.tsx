'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ConfirmationModal from '@/components/ConfirmationModal'
import NotificationModal from '@/components/NotificationModal'
import ToastManager from '@/components/ToastManager'
import ImageModal from '@/components/ImageModal'
import ApplicationModal from '@/components/ApplicationModal'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import PropertiesBrowser from '@/components/dashboard/PropertiesBrowser'
import AgentProperties from '@/components/dashboard/AgentProperties'
import DashboardApplications from '@/components/dashboard/DashboardApplications'
import SavedProperties from '@/components/dashboard/SavedProperties'
import DashboardAccount from '@/components/dashboard/DashboardAccount'
import CommissionTracking from '@/components/dashboard/CommissionTracking'
import { useDashboardAuth } from '@/hooks/useDashboardAuth'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useRealTimeSubscriptions } from '@/hooks/useRealTimeSubscriptions'
import { useNavigationState, restoreNavigationState } from '@/hooks/useNavigationState'
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

export default function DashboardContent() {
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
  const [activeTab, setActiveTab] = useState<DashboardTab>((searchParams.get('tab') as DashboardTab) || 'overview')

  // Sync URL when activeTab changes programmatically
  const updateActiveTab = (tab: DashboardTab) => {
    setActiveTab(tab)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', tab)
    window.history.replaceState({}, '', newUrl.toString())
  }
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
    allImages: [],
    initialIndex: 0
  })

  // Helper functions for modals
  const showConfirmation = (config: Omit<ConfirmationModalType, 'isOpen'>) => {
    setConfirmationModal({ ...config, isOpen: true })
  }

  const showNotification = (config: Omit<NotificationModalType, 'isOpen'>) => {
    setNotificationModal({ ...config, isOpen: true })
  }

  const closeConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }))
  }

  const closeNotification = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }))
  }

  const openImageModal = (src: string | null, alt: string, allImages?: string[], initialIndex?: number) => {
    if (src) {
      setImageModal({
        isOpen: true,
        src,
        alt,
        allImages: allImages || (src ? [src] : []),
        initialIndex: initialIndex || 0
      })
    }
  }

  const closeImageModal = () => {
    setImageModal({ isOpen: false, src: '', alt: '', allImages: [], initialIndex: 0 })
  }

  // Update active tab from URL (only on initial load)
  useEffect(() => {
    const tab = searchParams.get('tab') as DashboardTab
    if (tab && tab !== activeTab) {
      // Use setActiveTab directly here to avoid URL update loop
      // since the URL already has the correct tab parameter
      setActiveTab(tab)
    }
  }, [searchParams])

  // Handle apply parameter from URL
  useEffect(() => {
    if (!user || !profile) return

    const applyParam = searchParams.get('apply')
    const storedRedirect = typeof window !== 'undefined' ? localStorage.getItem('redirect_after_auth') : null

    let propertyIdToApply = applyParam

    if (!propertyIdToApply && storedRedirect) {
      const url = new URL(storedRedirect, window.location.origin)
      propertyIdToApply = url.searchParams.get('apply')
    }

    if (propertyIdToApply && user && profile?.role === 'tenant') {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('apply')
      // Preserve the current tab parameter to avoid triggering tab useEffect
      if (activeTab && activeTab !== 'overview') {
        newUrl.searchParams.set('tab', activeTab)
      }
      window.history.replaceState({}, '', newUrl.toString())

      setTimeout(() => {
        handleApplyToProperty(propertyIdToApply!)
      }, 1000)
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('redirect_after_auth')
    }
  }, [user, profile, searchParams, activeTab])

  const handleBrowseProperties = () => {
    updateActiveTab('browse')
  }

  // Property action handlers
  const handleSaveProperty = async (propertyId: string) => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .insert({
          property_id: propertyId,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      const property = allProperties.find(p => p.id === propertyId)
      if (property && data) {
        showNotification({
          title: 'Property Saved',
          message: `"${property.title}" has been added to your saved properties.`,
          type: 'success',
          icon: '💾'
        })
      }
    } catch (error: any) {
      showNotification({
        title: 'Save Failed',
        message: error.message,
        type: 'error'
      })
    }
  }

  const handleUnsaveProperty = async (propertyId: string) => {
    if (!user) return
    
    const property = allProperties.find(p => p.id === propertyId)
    showConfirmation({
      title: 'Remove from Saved',
      message: `Remove "${property?.title}" from saved properties?`,
      type: 'warning',
      confirmText: 'Remove',

      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('saved_properties')
            .delete()
            .eq('property_id', propertyId)
            .eq('user_id', user.id)
          
          if (error) throw error
          
          showNotification({
            title: 'Property Removed',
            message: 'Property removed from saved list successfully!',
            type: 'success',

          })
        } catch (error: any) {
          showNotification({
            title: 'Remove Failed',
            message: error.message,
            type: 'error'
          })
        }
      }
    })
  }

  const handleCancelApplication = async (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId)
    const property = application?.property

    showConfirmation({
      title: 'Cancel Application',
      message: `Are you sure you want to cancel your application for "${property?.title}"?`,
      type: 'danger',
      confirmText: 'Yes, cancel',
      icon: '🚫',
      onConfirm: async () => {
        const result = await cancelApplication(applicationId)
        if (result.error) {
          showNotification({ title: 'Error', message: result.error, type: 'error' })
        } else {
          showNotification({ title: 'Success', message: 'Application cancelled.', type: 'success' })
        }
      }
    })
  }

  const handleApplyToProperty = async (propertyId: string) => {
    if (!user) return

    // Double-check for existing application with fresh data from database
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('bed_id', propertyId)
      .eq('tenant_id', user.id)
      .single()

    if (existingApp) {
      showNotification({
        title: 'Already Applied',
        message: 'You have already applied to this property.',
        type: 'warning',
        icon: '⚠️'
      })
      return
    }

    // Also check local applications array as backup
    if (applications.some(app => app.bed_id === propertyId)) {
      showNotification({
        title: 'Already Applied',
        message: 'You have already applied to this property.',
        type: 'warning',
        icon: '⚠️'
      })
      return
    }

    // Fetch available beds for the property
    const { data: beds, error } = await supabase
      .from('beds')
      .select('id, bed_number, room_id')
      .eq('is_occupied', false)
      .in('room_id',
        (await supabase.from('rooms').select('id').eq('property_id', propertyId)).data?.map(r => r.id) || []
      )

    if (error) {
      showNotification({ title: 'Error', message: 'Could not fetch available beds.', type: 'error' })
      return
    }

    setApplicationModal({
      isOpen: true,
      bedId: null // Will be selected in the modal
    })
    setAvailableBeds(beds || [])
  }

  const handleApproveApplication = (applicationId: string) => {
    showConfirmation({
        title: 'Approve Application',
        message: 'Are you sure you want to approve this application? The tenant will be notified.',
        type: 'success',
        confirmText: 'Approve',

        onConfirm: async () => {
            const result = await updateApplicationStatus(applicationId, 'approved');
            if (result.error) {
                showNotification({ title: 'Error', message: result.error, type: 'error' });
            } else {
                showNotification({
                    title: 'Application Approved!',
                    message: 'The tenant has been notified and can now proceed with payment.',
                    type: 'success'
                });
                // Refresh data to show updated status
                refreshData();
            }
        }
    });
  }
  
  const handleVerifyPayment = (applicationId: string) => {
    showConfirmation({
      title: 'Verify Payment',
      message: 'Confirm that you have received this payment in your EcoCash account?',
      type: 'success',
      confirmText: 'Verify Payment',
      icon: '💰',
      onConfirm: async () => {
        const result = await verifyPayment(applicationId);
        if (result.error) {
          showNotification({ title: 'Error', message: result.error, type: 'error' });
        } else {
          showNotification({
            title: 'Payment Verified',
            message: 'The payment has been marked as verified. Dashboard will refresh automatically.',
            type: 'success'
          });

          // Force refresh the dashboard data to ensure UI updates
          setTimeout(() => {
            refreshData();
          }, 1000);
        }
      }
    });
  };

  const handleRejectApplication = (applicationId: string) => {
      showConfirmation({
          title: 'Reject Application',
          message: 'Are you sure you want to reject this application?',
          type: 'danger',
          confirmText: 'Reject',
          icon: '🚫',
          onConfirm: async () => {
              const result = await updateApplicationStatus(applicationId, 'rejected');
              if (result.error) {
                  showNotification({ title: 'Error', message: result.error, type: 'error' });
              } else {
                  showNotification({ title: 'Success', message: 'Application rejected.', type: 'success' });
              }
          }
      });
  }

  const updateEcocashNumber = async (ecocashNumber: string) => {
    if (!user || !profile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ecocash_number: ecocashNumber })
        .eq('id', user.id);
        
      if (error) throw error;
      
      showNotification({
        title: 'Success!',
        message: 'Your EcoCash number has been updated successfully.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error updating EcoCash number:', err);
      showNotification({
        title: 'Error',
        message: 'Failed to update your EcoCash number. Please try again.',
        type: 'error',
      });
    }
  };

  // Loading and error states
  const loading = authLoading || dataLoading
  const error = authError || dataError

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => {
                // Try to refresh data first, fallback to router refresh
                if (refreshData) {
                  refreshData()
                } else {
                  router.refresh()
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <DashboardHeader onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-12">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {displayName}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Here's your personalized dashboard for UniStay.
          </p>
        </div>
        
        {/* Tab Navigation */}
        <DashboardTabs 
          activeTab={activeTab} 
          setActiveTab={updateActiveTab} 
          profile={profile} 
        />
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <DashboardOverview
            profile={profile}
            properties={properties}
            agentApplications={agentApplications}
            tenantApplications={applications}
            savedProperties={savedProperties}
            setActiveTab={updateActiveTab}
            onBrowseProperties={handleBrowseProperties}
          />
        )}

        {activeTab === 'browse' && (
          <PropertiesBrowser
            allProperties={allProperties}
            applications={applications}
            savedProperties={savedProperties}
            profile={profile}
            onApplyToProperty={handleApplyToProperty}
            onCancelApplication={handleCancelApplication}
            onSaveProperty={handleSaveProperty}
            onUnsaveProperty={handleUnsaveProperty}
            onImageClick={openImageModal}
          />
        )}

        {activeTab === 'properties' && (profile?.role === 'agent' && profile?.agent_status === 'active') && (
          <AgentProperties
            properties={properties}
            onImageClick={openImageModal}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'applications' && (
          <DashboardApplications
            profile={profile}
            applications={applications}
            agentApplications={agentApplications}
            onApproveApplication={handleApproveApplication}
            onRejectApplication={handleRejectApplication}
            onVerifyPayment={handleVerifyPayment}
          />
        )}

        {activeTab === 'saved' && profile?.role === 'tenant' && (
          <SavedProperties
            savedProperties={savedProperties}
            applications={applications}
            onApplyToProperty={handleApplyToProperty}
            onCancelApplication={handleCancelApplication}
            onUnsaveProperty={handleUnsaveProperty}
            onImageClick={openImageModal}
            setActiveTab={updateActiveTab}
          />
        )}

        {activeTab === 'account' && (
          <DashboardAccount
            user={user}
            profile={profile}
            onSignOut={handleSignOut}
            onUpdateEcocash={updateEcocashNumber}
          />
        )}

        {activeTab === 'commission' && (profile?.role === 'agent' && profile?.agent_status === 'active') && (
          <CommissionTracking
            agentApplications={agentApplications}
          />
        )}
      </main>

      {/* Modals */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText={confirmationModal.confirmText}
        icon={confirmationModal.icon}
      />

      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={closeNotification}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
        icon={notificationModal.icon}
      />

      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        src={imageModal.src}
        alt={imageModal.alt}
        allImages={imageModal.allImages}
        initialIndex={imageModal.initialIndex}
      />

      <ApplicationModal
        isOpen={applicationModal.isOpen}
        onClose={() => setApplicationModal({ isOpen: false, bedId: null })}
        beds={availableBeds}
        onSubmit={async (details) => {
          if (!details.bed_id) return

          const result = await submitApplication(
            details.bed_id,
            details.registration_number,
            details.national_id,
            details.gender
          )
          if (result.error) {
            showNotification({
              title: 'Error',
              message: result.error,
              type: 'error'
            })
          } else {
            showNotification({
              title: 'Success',
              message: 'Application submitted successfully!',
              type: 'success'
            })
            setApplicationModal({ isOpen: false, bedId: null })
            setAvailableBeds([])
            refreshData()
          }
        }}
      />

      {/* Toast Notifications */}
      <ToastManager />
    </div>
  )
}
