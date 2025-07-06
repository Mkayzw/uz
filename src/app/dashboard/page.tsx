'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import ThemeToggle from '@/components/ThemeToggle'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'landlord' | 'agent'
  agent_status: 'not_applicable' | 'pending_payment' | 'active'
}

interface Property {
  id: string;
  title: string;
  location: string | null;
  image_url: string | null;
  view_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        setUser(user)

        // Fetch user profile from the database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load user profile')
        } else {
          setProfile(profileData)
          // If user is a landlord or active agent, fetch their properties
          if (profileData && (profileData.role === 'landlord' || (profileData.role === 'agent' && profileData.agent_status === 'active'))) {
            const { data: propertiesData, error: propertiesError } = await supabase
              .from('pads')
              .select('*')
              .eq('created_by', user.id)

            if (propertiesError) {
              console.error('Error fetching properties:', propertiesError)
              setError('Failed to load your properties')
            } else {
              setProperties(propertiesData)
            }
          }
        }
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getRoleInfo = (role: string, agentStatus?: string) => {
    switch (role) {
      case 'tenant':
        return { 
          icon: '🎓', 
          color: 'blue', 
          title: 'Tenant',
          description: 'You can browse and apply for accommodation.',
          actions: ['Browse Properties', 'My Applications', 'Saved Properties']
        }
      case 'landlord':
        return { 
          icon: '🏠', 
          color: 'green', 
          title: 'Landlord',
          description: 'You can list and manage your properties.',
          actions: ['Add Property', 'Manage Listings', 'View Applications']
        }
      case 'agent':
        const isActive = agentStatus === 'active'
        return { 
          icon: '🤝', 
          color: isActive ? 'purple' : 'yellow', 
          title: 'Agent',
          description: isActive 
            ? 'You can manage property listings for clients.' 
            : 'Complete payment to activate your agent account.',
          actions: isActive 
            ? ['Manage Client Properties', 'Commission Tracking', 'Client Management']
            : ['Complete Payment', 'View Pricing', 'Contact Support']
        }
      default:
        return { 
          icon: '👤', 
          color: 'gray', 
          title: 'User',
          description: 'Your dashboard is ready.',
          actions: ['Update Profile']
        }
    }
  }

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
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(profile?.role || 'tenant', profile?.agent_status)
  const displayName = profile?.full_name || user?.email || 'User'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">uzoca</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {displayName}!
          </h2>
          <p className=" dark:bg-gray-800 dark:text-gray-300">
            Here's your personalized dashboard for uzoca.
          </p>
        </div>

        {/* Role Status Card */}
        <div className={`rounded-2xl p-6 mb-8 ${
          roleInfo.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' :
          roleInfo.color === 'green' ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' :
          roleInfo.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700' :
          roleInfo.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700' :
          'bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center">
            <div className="text-4xl mr-4">{roleInfo.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {roleInfo.title}
                </h3>
                {profile?.role === 'agent' && (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    profile.agent_status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {profile.agent_status === 'active' ? 'Active' : 'Pending Payment'}
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300">{roleInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleInfo.actions.map((action, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">{action}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {action.includes('Browse') && 'Discover available properties near UZ campus.'}
                {action.includes('Add') && 'List a new property for students.'}
                {action.includes('Manage') && 'View and update your existing listings.'}
                {action.includes('Applications') && 'Track your property applications.'}
                {action.includes('Payment') && 'Activate your agent account.'}
                {action.includes('Profile') && 'Update your account information.'}
                {action.includes('Commission') && 'Track your earnings and payments.'}
                {action.includes('Client') && 'Manage your client relationships.'}
                {action.includes('Pricing') && 'View agent subscription plans.'}
                {action.includes('Support') && 'Get help with your account.'}
                {action.includes('Saved') && 'View your bookmarked properties.'}
              </p>
              <button 
                onClick={() => action.includes('Add') && router.push('/dashboard/list-property')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {action}
              </button>
            </div>
          ))}
        </div>

        {/* Stats Section for Landlords and Agents */}
        {(profile?.role === 'landlord' || (profile?.role === 'agent' && profile?.agent_status === 'active')) && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Statistics</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{properties.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Listings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Bookings</div>
              </div>
            </div>
          </div>
        )}

        {/* Your Property Listings */}
        {(profile?.role === 'landlord' || (profile?.role === 'agent' && profile?.agent_status === 'active')) && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Property Listings</h3>
            {properties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col">
                    <img src={property.image_url || '/file.svg'} alt={property.title} className="w-full h-40 object-cover rounded-t-2xl" />
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex-grow">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">{property.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{property.location}</p>
                      </div>
                      <div className="flex justify-end items-center gap-2 mt-4">
                        <button className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                          Edit
                        </button>
                        <button className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                          Unpublish
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
                <p className="text-gray-600 dark:text-gray-400">You haven't listed any properties yet.</p>
                <button
                  onClick={() => router.push('/dashboard/list-property')}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  List Your First Property
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
