import { useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { UserProfile, Property, Application, SavedProperty } from '@/types/dashboard'
import { useToast } from '@/components/ToastManager'
import {
  getProfile,
  getAgentProperties,
  getAllActiveProperties,
  getTenantApplications,
  getSavedProperties,
  getAgentApplications,
} from '@/lib/utils/dashboard'
import { useSupabaseClient } from './useSupabaseClient'
import { downloadReceipt } from '@/lib/utils/downloadHelpers'

interface UseRealTimeSubscriptionsProps {
  user: User | null
  profile: UserProfile | null
  setProfile: (profile: UserProfile | null) => void
  setProperties: (properties: Property[]) => void
  setAllProperties: (properties: Property[]) => void
  setApplications: (applications: Application[]) => void
  setAgentApplications: (applications: Application[]) => void
  setSavedProperties: (savedProperties: SavedProperty[]) => void
}

export function useRealTimeSubscriptions({
  user,
  profile,
  setProfile,
  setProperties,
  setAllProperties,
  setApplications,
  setAgentApplications,
  setSavedProperties
}: UseRealTimeSubscriptionsProps) {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()

  useEffect(() => {
    if (!user || !profile) return

    // Profile changes subscription
    const profileChannel = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, async () => {
        try {
          const updatedProfile = await getProfile(supabase, user)
          setProfile(updatedProfile)
        } catch (error) {
          console.error('Error updating profile:', error)
        }
      })
      .subscribe()

    // Properties subscription (for agents)
    const propertiesChannel = supabase
      .channel(`properties:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'properties',
        filter: `owner_id=eq.${user.id}`
      }, async () => {
        if (profile.role === 'agent' && profile.agent_status === 'active') {
          try {
            const updatedProperties = await getAgentProperties(supabase, user.id)
            setProperties(updatedProperties)
          } catch (error) {
            console.error('Error updating properties:', error)
          }
        }
      })
      .subscribe()

    // Applications subscription
    const applicationsChannel = supabase
      .channel(`applications:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications'
      }, async (payload) => {
        try {
          if (profile.role === 'tenant') {
            const updatedApplications = await getTenantApplications(supabase, user.id)
            setApplications(updatedApplications)

            // Show notification for status changes and payment verification
            if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
              const newStatus = payload.new.status
              const oldStatus = payload.old.status
              const newPaymentVerified = payload.new.payment_verified
              const oldPaymentVerified = payload.old.payment_verified
              const tenantId = payload.new.tenant_id

              // Only show notification if this is the current user's application
              if (tenantId === user.id) {
                // Status change notifications
                if (newStatus !== oldStatus) {
                  if (newStatus === 'approved') {
                    // Show approval notification with payment link
                    addToast({
                      title: '🎉 Application Approved!',
                      message: 'Your application has been approved. Complete your payment to secure your place.',
                      type: 'success',
                      duration: 10000,
                      actionButton: {
                        text: 'Pay Now',
                        onClick: () => {
                          window.location.href = `/dashboard/payment?application_id=${payload.new.id}&type=rent`
                        }
                      }
                    })
                  } else if (newStatus === 'rejected') {
                    addToast({
                      title: 'Application Update',
                      message: 'Your application has been rejected. You can apply to other properties.',
                      type: 'error',
                      duration: 8000
                    })
                  }
                }

                // Payment verification notification
                if (newPaymentVerified !== oldPaymentVerified && newPaymentVerified) {
                  addToast({
                    title: '✅ Payment Verified!',
                    message: 'Your payment has been verified. You can now download your receipt.',
                    type: 'success',
                    duration: 8000,
                    actionButton: {
                      text: 'Download Receipt',
                      onClick: () => {
                        downloadReceipt(
                          payload.new.id,
                          (error: string) => {
                            console.error('Download failed:', error)
                          }
                        )
                      }
                    }
                  })
                }
              }
            }
          } else if (profile.role === 'agent' && profile.agent_status === 'active') {
            const updatedAgentApplications = await getAgentApplications(supabase, user.id)
            setAgentApplications(updatedAgentApplications)

            // Show notification for payment verification updates
            if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
              const newPaymentVerified = payload.new.payment_verified
              const oldPaymentVerified = payload.old.payment_verified

              // Check if this application belongs to this agent's properties
              const agentBedIds = updatedAgentApplications.map(app => app.bed_id)
              if (agentBedIds.includes(payload.new.bed_id) &&
                  newPaymentVerified !== oldPaymentVerified && newPaymentVerified) {
                addToast({
                  title: '💰 Payment Verified!',
                  message: 'A tenant payment has been successfully verified.',
                  type: 'success',
                  duration: 5000
                })
              }
            }
          }
        } catch (error) {
          console.error('Error updating applications:', error)
        }
      })
      .subscribe()

    // Saved properties subscription (for tenants)
    const savedPropertiesChannel = supabase
      .channel(`saved_properties:${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'saved_properties',
        filter: `user_id=eq.${user.id}`
      }, async () => {
        if (profile.role === 'tenant') {
          try {
            const updatedSavedProperties = await getSavedProperties(supabase, user.id)
            setSavedProperties(updatedSavedProperties)
          } catch (error) {
            console.error('Error updating saved properties:', error)
          }
        }
      })
      .subscribe()

    // Note: Removed duplicate public applications subscription to prevent race conditions
    // Agent applications are already handled in the main applications subscription above

    // Public properties subscription
    const propChannelPublic = supabase
      .channel('public:pads')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pads' 
      }, async () => {
        try {
          const updatedAllProperties = await getAllActiveProperties(supabase)
          setAllProperties(updatedAllProperties)
        } catch (error) {
          console.error('Error updating public properties:', error)
        }
      })
      .subscribe()

    // Cleanup function
    return () => {
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(propertiesChannel)
      supabase.removeChannel(applicationsChannel)
      supabase.removeChannel(savedPropertiesChannel)
      supabase.removeChannel(propChannelPublic)
    }
  }, [user?.id, profile?.role, profile?.agent_status, supabase, setProfile, setProperties, setAllProperties, setApplications, setAgentApplications, setSavedProperties])
}
