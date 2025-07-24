import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Property, Application, SavedProperty, UserProfile } from '@/types/dashboard'
import {
  getAgentProperties,
  getAllActiveProperties,
  getTenantApplications,
  getSavedProperties,
  getAgentApplications,
} from '@/lib/utils/dashboard'
import { useSupabaseClient } from './useSupabaseClient'

interface UseDashboardDataProps {
  user: User | null
  profile: UserProfile | null
}

export function useDashboardData({ user, profile }: UseDashboardDataProps) {
  const supabase = useSupabaseClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [agentApplications, setAgentApplications] = useState<Application[]>([])
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !profile) return

    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load all active properties for browsing
        const allPropsData = await getAllActiveProperties(supabase)
        setAllProperties(allPropsData)

        // Load role-specific data
        if (profile.role === 'agent' && profile.agent_status === 'active') {
          const [agentPropsData, agentAppsData] = await Promise.all([
            getAgentProperties(supabase, user.id),
            getAgentApplications(supabase, user.id)
          ])
          setProperties(agentPropsData)
          setAgentApplications(agentAppsData)
        }

        if (profile.role === 'tenant') {
          const [tenantAppsData, savedPropsData] = await Promise.all([
            getTenantApplications(supabase, user.id),
            getSavedProperties(supabase, user.id)
          ])
          setApplications(tenantAppsData)
          setSavedProperties(savedPropsData)
        }

      } catch (err) {
        console.error('Data loading error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id, profile?.role, profile?.agent_status])

  const refreshData = async () => {
    if (!user || !profile) return

    try {
      // Refresh all active properties
      const allPropsData = await getAllActiveProperties(supabase)
      setAllProperties(allPropsData)

      // Refresh role-specific data
      if (profile.role === 'agent' && profile.agent_status === 'active') {
        const [agentPropsData, agentAppsData] = await Promise.all([
          getAgentProperties(supabase, user.id),
          getAgentApplications(supabase, user.id)
        ])
        setProperties(agentPropsData)
        setAgentApplications(agentAppsData)
      }

      if (profile.role === 'tenant') {
        const [tenantAppsData, savedPropsData] = await Promise.all([
          getTenantApplications(supabase, user.id),
          getSavedProperties(supabase, user.id)
        ])
        setApplications(tenantAppsData)
        setSavedProperties(savedPropsData)
      }
    } catch (err) {
      console.error('Data refresh error:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    }
  }

  return {
    properties,
    allProperties,
    applications,
    agentApplications,
    savedProperties,
    loading,
    error,
    refreshData,
    setProperties,
    setAllProperties,
    setApplications,
    setAgentApplications,
    setSavedProperties
  }
}
