import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile, Property, Application, SavedProperty } from '@/types/dashboard'
import {
  getProfile,
  getAgentProperties,
  getAllActiveProperties,
  getTenantApplications,
  getSavedProperties,
  getAgentApplications,
} from '@/lib/utils/dashboard'

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
  const supabase = createClient()

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
        table: 'pads',
        filter: `created_by=eq.${user.id}`
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
      }, async () => {
        try {
          if (profile.role === 'tenant') {
            const updatedApplications = await getTenantApplications(supabase, user.id)
            setApplications(updatedApplications)
          } else if (profile.role === 'agent' && profile.agent_status === 'active') {
            const updatedAgentApplications = await getAgentApplications(supabase, user.id)
            setAgentApplications(updatedAgentApplications)
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

    // Public applications subscription
    const appChannelPublic = supabase
      .channel('public:applications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'applications' 
      }, async () => {
        try {
          if (profile.role === 'agent' && profile.agent_status === 'active') {
            const updatedAgentApplications = await getAgentApplications(supabase, user.id)
            setAgentApplications(updatedAgentApplications)
          }
        } catch (error) {
          console.error('Error updating public applications:', error)
        }
      })
      .subscribe()

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
      supabase.removeChannel(appChannelPublic)
      supabase.removeChannel(propChannelPublic)
    }
  }, [user?.id, profile?.role, profile?.agent_status, supabase, setProfile, setProperties, setAllProperties, setApplications, setAgentApplications, setSavedProperties])
}
