'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'landlord' | 'agent'
  agent_status: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
}

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: ('tenant' | 'landlord' | 'agent')[]
  requiresActiveAgent?: boolean
}

export default function AuthGuard({ 
  children, 
  allowedRoles,
  requiresActiveAgent = false 
}: AuthGuardProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/auth/login')
          return
        }

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single<UserProfile>()

        if (profileError || !userProfile) {
          router.push('/auth/login')
          return
        }

        // Check role permissions
        if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
          router.push('/dashboard')
          return
        }

        // Check agent status if required
        if (requiresActiveAgent && userProfile.role === 'agent' && userProfile.agent_status !== 'active') {
          router.push('/dashboard')
          return
        }

        setAuthorized(true)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, allowedRoles, requiresActiveAgent, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-yellow-500 text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don&apos;t have permission to access this page.
            </p>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
