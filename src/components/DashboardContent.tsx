'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import ThemeToggle from '@/components/ThemeToggle'
import PropertyImage from '@/components/PropertyImage'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'landlord' | 'agent'
  agent_status: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
}

interface Property {
  id: string;
  title: string;
  location: string | null;
  image_url: string | null;
  view_count: number;
  created_at: string;
  description?: string | null;
  price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  image_urls?: string[] | null;
  active?: boolean;
  property_type?: string | null;
  has_internet?: boolean;
  has_parking?: boolean;
  has_air_conditioning?: boolean;
  is_furnished?: boolean;
}

interface Application {
  id: string;
  property_id: string;
  tenant_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  property?: Property;
}

interface SavedProperty {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  property?: Property;
}

export default function DashboardContent() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [propertySearchTerm, setPropertySearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000])
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('')
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
          
          // Fetch all properties for browsing (for all users)
          const { data: allPropsData, error: allPropsError } = await supabase
            .from('pads')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })

          if (allPropsError) {
            console.error('Error fetching all properties:', allPropsError)
          } else {
            setAllProperties(allPropsData || [])
          }
          
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
              setProperties(propertiesData || [])
            }
          }
          
          // If user is a tenant, fetch their applications and saved properties
          if (profileData && profileData.role === 'tenant') {
            
            setApplications([])
            
            // Fetch saved properties (placeholder - you'll need to create this table)
            // For now, set empty array
            setSavedProperties([])
          }
        }
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false
        )
      }
    }

    getUser()

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` },
        (payload) => {
          setProfile(payload.new as UserProfile)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, user?.id, supabase])

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
        const isPendingVerification = agentStatus === 'pending_verification'
        return { 
          icon: '🤝', 
          color: isActive ? 'purple' : 'yellow', 
          title: 'Agent',
          description: isActive 
            ? 'You can manage property listings for clients.' 
            : isPendingVerification
            ? 'Your payment is being verified. This may take up to 24 hours.'
            : 'Complete payment to activate your agent account.',
          actions: isActive 
            ? ['Manage Client Properties', 'Commission Tracking', 'Client Management']
            : isPendingVerification
            ? ['View Payment Status', 'Contact Support']
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

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleBrowseProperties = () => {
    setActiveTab('browse')
  }

  const handleSaveProperty = async (propertyId: string) => {
    if (!user) return
    
    try {
      // In a real app, you would save to a 'saved_properties' table
      // For now, we'll just add it to local state
      const property = allProperties.find(p => p.id === propertyId)
      if (property) {
        const newSavedProperty: SavedProperty = {
          id: Date.now().toString(),
          property_id: propertyId,
          user_id: user.id,
          created_at: new Date().toISOString(),
          property
        }
        setSavedProperties(prev => [...prev, newSavedProperty])
      }
    } catch (error) {
      console.error('Error saving property:', error)
    }
  }

  const handleUnsaveProperty = (propertyId: string) => {
    setSavedProperties(prev => prev.filter(sp => sp.property_id !== propertyId))
  }

  const handleApplyToProperty = async (propertyId: string) => {
    if (!user) return
    
    try {
      // In a real app, you would save to an 'applications' table
      // For now, we'll just add it to local state
      const property = allProperties.find(p => p.id === propertyId)
      if (property) {
        const newApplication: Application = {
          id: Date.now().toString(),
          property_id: propertyId,
          tenant_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          property
        }
        setApplications(prev => [...prev, newApplication])
      }
    } catch (error) {
      console.error('Error applying to property:', error)
    }
  }

  const filteredProperties = allProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
                         property.location?.toLowerCase().includes(propertySearchTerm.toLowerCase())
    const matchesPrice = !property.price || (property.price >= priceRange[0] && property.price <= priceRange[1])
    const matchesType = !propertyTypeFilter || property.property_type === propertyTypeFilter
    return matchesSearch && matchesPrice && matchesType
  })

  const isPropertySaved = (propertyId: string) => {
    return savedProperties.some(sp => sp.property_id === propertyId)
  }

  const hasAppliedToProperty = (propertyId: string) => {
    return applications.some(app => app.property_id === propertyId)
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
          <p className="dark:bg-gray-800 dark:text-gray-300">
            Here&apos;s your personalized dashboard for uzoca.
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">Select a tab</label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
              defaultValue={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="overview">Overview</option>
              <option value="browse">Browse Properties</option>
              {(profile?.role === 'landlord' || (profile?.role === 'agent' && profile?.agent_status === 'active')) && (
                <option value="properties">My Properties</option>
              )}
              <option value="applications">Applications</option>
              {profile?.role === 'tenant' && (
                <option value="saved">Saved Properties</option>
              )}
              <option value="account">Account</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Overview
                </button>
                
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`${
                    activeTab === 'browse'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Browse Properties
                </button>
                
                {(profile?.role === 'landlord' || (profile?.role === 'agent' && profile?.agent_status === 'active')) && (
                  <button
                    onClick={() => setActiveTab('properties')}
                    className={`${
                      activeTab === 'properties'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    My Properties
                  </button>
                )}
                
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`${
                    activeTab === 'applications'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Applications
                </button>
                
                {profile?.role === 'tenant' && (
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`${
                      activeTab === 'saved'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Saved Properties
                  </button>
                )}
                
                <button
                  onClick={() => setActiveTab('account')}
                  className={`${
                    activeTab === 'account'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Account
                </button>
              </nav>
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
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
                          : profile.agent_status === 'pending_verification'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {profile.agent_status === 'active' ? 'Active' : profile.agent_status === 'pending_verification' ? 'Pending Verification' : 'Pending Payment'}
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
                    onClick={() => {
                      if (action.includes('Browse')) {
                        handleBrowseProperties();
                      } else if (action.includes('Add')) {
                        router.push('/dashboard/list-property');
                      } else if (action.includes('Manage')) {
                        router.push('/dashboard/manage-properties');
                      } else if (action.includes('Payment')) {
                        router.push('/dashboard/payment');
                      } else if (action.includes('Applications')) {
                        setActiveTab('applications');
                      } else if (action.includes('Saved')) {
                        setActiveTab('saved');
                      }
                    }}
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
          </div>
        )}

        {/* Browse Properties Tab */}
        {activeTab === 'browse' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Browse Properties</h3>
              
              {/* Search and Filter Controls */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Properties
                    </label>
                    <input
                      type="text"
                      id="search"
                      value={propertySearchTerm}
                      onChange={(e) => setPropertySearchTerm(e.target.value)}
                      placeholder="Search by title or location..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="property-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Property Type
                    </label>
                    <select
                      id="property-type"
                      value={propertyTypeFilter}
                      onChange={(e) => setPropertyTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Types</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="room">Room</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                  <PropertyImage
                    src={property.image_url}
                    alt={property.title}
                    className="w-full h-48 object-cover rounded-t-2xl"
                  />
                  <div className="p-6">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{property.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{property.location}</p>
                    {property.price && (
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                        ${property.price}/month
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {property.bedrooms && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                          {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                          {property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}
                        </span>
                      )}
                      {property.has_internet && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                          WiFi
                        </span>
                      )}
                      {property.has_parking && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                          Parking
                        </span>
                      )}
                      {property.is_furnished && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                          Furnished
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {profile?.role === 'tenant' && (
                        <>
                          <button
                            onClick={() => handleApplyToProperty(property.id)}
                            disabled={hasAppliedToProperty(property.id)}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              hasAppliedToProperty(property.id)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {hasAppliedToProperty(property.id) ? 'Applied' : 'Apply'}
                          </button>
                          <button
                            onClick={() => isPropertySaved(property.id) 
                              ? handleUnsaveProperty(property.id) 
                              : handleSaveProperty(property.id)
                            }
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isPropertySaved(property.id)
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            {isPropertySaved(property.id) ? 'Unsave' : 'Save'}
                          </button>
                        </>
                      )}
                      {profile?.role !== 'tenant' && (
                        <button className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No properties found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search criteria or check back later for new listings.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (profile?.role === 'landlord' || (profile?.role === 'agent' && profile?.agent_status === 'active')) && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Property Listings</h3>
              <button
                onClick={() => router.push('/dashboard/list-property')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Property
              </button>
            </div>
            
            {properties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col">
                    <PropertyImage
                      src={property.image_url}
                      alt={property.title}
                      className="w-full h-40 object-cover rounded-t-2xl"
                    />
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex-grow">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">{property.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{property.location}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {property.view_count || 0} {property.view_count === 1 ? 'view' : 'views'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/edit-property/${property.id}`)}
                            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Unpublish
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No properties</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new property listing
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/dashboard/list-property')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Property
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => router.push('/dashboard/manage-properties')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                View All Properties
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Saved Properties Tab */}
        {activeTab === 'saved' && profile?.role === 'tenant' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Saved Properties</h3>
            
            {savedProperties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((savedProperty) => (
                  <div key={savedProperty.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                    <PropertyImage
                      src={savedProperty.property?.image_url || null}
                      alt={savedProperty.property?.title || 'Property'}
                      className="w-full h-48 object-cover rounded-t-2xl"
                    />
                    <div className="p-6">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{savedProperty.property?.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{savedProperty.property?.location}</p>
                      {savedProperty.property?.price && (
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                          ${savedProperty.property.price}/month
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApplyToProperty(savedProperty.property_id)}
                          disabled={hasAppliedToProperty(savedProperty.property_id)}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            hasAppliedToProperty(savedProperty.property_id)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {hasAppliedToProperty(savedProperty.property_id) ? 'Applied' : 'Apply'}
                        </button>
                        <button
                          onClick={() => handleUnsaveProperty(savedProperty.property_id)}
                          className="px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No saved properties</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start browsing properties and save your favorites here.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Properties
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {profile?.role === 'tenant' ? 'My Applications' : 'Property Applications'}
            </h3>
            
            {profile?.role === 'tenant' ? (
              // Tenant view - show their applications
              applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {application.property?.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {application.property?.location}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Applied on {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            application.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : application.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No applications yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You haven't applied to any properties yet.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Properties
                    </button>
                  </div>
                </div>
              )
            ) : (
              // Landlord/Agent view - show applications to their properties
              <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No applications yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You haven't received any applications yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Profile Information</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="text-gray-900 dark:text-white">{profile?.full_name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="text-gray-900 dark:text-white">{user?.email || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                      <p className="text-gray-900 dark:text-white capitalize">{profile?.role || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                      <p className="text-gray-900 dark:text-white">Active</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Account Actions</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Edit Profile
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
                    Change Password
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
