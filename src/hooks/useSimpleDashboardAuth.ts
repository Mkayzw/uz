import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'
import { useSupabaseClient } from './useSupabaseClient'
import { createClient } from '@/lib/supabase/client'

export function useSimpleDashboardAuth() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      try {
        console.log('🔄 Simple auth initialization...')
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (session?.user) {
          console.log('✅ Session found for user:', session.user.id)
          setUser(session.user)
          
          // Load profile directly
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (!mounted) return
            
            if (profileData && !profileError) {
              console.log('✅ Profile loaded:', { id: profileData.id, role: profileData.role })
              setProfile(profileData)
            } else {
              console.error('❌ Profile load failed:', profileError)
              setError('Failed to load profile')
            }
          } catch (err) {
            console.error('❌ Profile load error:', err)
            setError('Failed to load profile')
          }
        } else {
          console.log('ℹ️ No session found')
        }
        
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err)
        if (mounted) {
          setError('Authentication failed')
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initAuth()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event)
      
      if (!mounted) return
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setError('')
        router.push('/auth/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        // Profile will be loaded by the initialization above
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array - only run once

  const retryAuth = async () => {
    setError('')
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileData && !profileError) {
          setProfile(profileData)
        } else {
          setError('Failed to load profile')
        }
      }
    } catch (err) {
      setError('Retry failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setError('')
      router.push('/')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    isInitialized,
    canRetryAuth: !!error,
    retryAuth,
    handleSignOut
  }
}