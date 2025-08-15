'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@/hooks/useSupabaseClient'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'
import DashboardContent from './DashboardContent'

export default function DashboardRouter() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // Debug log to ensure we're using the new version
  console.log('🔄 DashboardRouter v2 loaded')

  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      try {
        console.log('🔄 Initializing dashboard auth...')
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (!session?.user) {
          console.log('ℹ️ No session found, redirecting to login')
          router.push('/auth/login')
          return
        }

        console.log('✅ Session found for user:', session.user.id)
        setUser(session.user)
        
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (!mounted) return
        
        if (profileError) {
          console.error('❌ Profile load failed:', profileError)
          
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            console.log('Creating new profile...')
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || null,
                role: 'tenant'
              }])
              .select()
              .single()
            
            if (!mounted) return
            
            if (createError) {
              console.error('❌ Profile creation failed:', createError)
              setError('Failed to create profile')
            } else {
              console.log('✅ Profile created:', newProfile)
              setProfile(newProfile)
            }
          } else {
            setError('Failed to load profile')
          }
        } else {
          console.log('✅ Profile loaded:', { id: profileData.id, role: profileData.role })
          setProfile(profileData)
          
          // Handle admin redirect
          if (profileData.role === 'admin') {
            router.push('/admin')
            return
          }
        }
        
        setLoading(false)
      } catch (err) {
        console.error('❌ Auth initialization error:', err)
        if (mounted) {
          setError('Authentication failed')
          setLoading(false)
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
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

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

  // Loading state
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

  // Error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={retryAuth}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No user - this should not happen as redirect is handled in useEffect
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // User exists but no profile yet - show loading with retry option
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Loading your profile...</p>
          <button
            onClick={retryAuth}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  // Admin users should be redirected to /admin (handled by useEffect above)
  // Show loading while redirect happens
  if (profile.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to admin dashboard...</p>
        </div>
      </div>
    )
  }

  // For tenant and agent users, show the dashboard content
  return <DashboardContent user={user} profile={profile} />
}