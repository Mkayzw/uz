import { useRouter } from 'next/navigation'
import { UserProfile, Property, Application, RoleInfo, DashboardTab } from '@/types/dashboard'
import { 
  AcademicCapIcon, 
  BuildingOfficeIcon, 
  UserIcon,
  HomeIcon,
  DocumentTextIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MapPinIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { 
  HeartIcon as HeartSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon 
} from '@heroicons/react/24/solid'

interface DashboardOverviewProps {
  profile: UserProfile | null
  properties: Property[]
  agentApplications: Application[]
  tenantApplications?: Application[]
  savedProperties?: any[]
  setActiveTab: (tab: DashboardTab) => void
  onBrowseProperties: () => void
}

export default function DashboardOverview({ 
  profile, 
  properties, 
  agentApplications,
  tenantApplications = [],
  savedProperties = [],
  setActiveTab,
  onBrowseProperties 
}: DashboardOverviewProps) {
  const router = useRouter()

  // Mock data for demonstration - replace with real API data
  const recentActivity = [
    {
      id: '1',
      type: 'application',
      title: 'Application submitted',
      description: 'Modern Apartment Downtown',
      timestamp: '2025-07-30T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      type: 'property',
      title: 'Property viewed',
      description: 'Cozy Studio Near Campus',
      timestamp: '2025-07-30T09:15:00Z',
      status: 'viewed'
    },
    {
      id: '3',
      type: 'message',
      title: 'New message',
      description: 'From John Smith (Agent)',
      timestamp: '2025-07-29T16:45:00Z',
      status: 'unread'
    }
  ]

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  const getStatusIcon = (type: string, status: string) => {
    switch (type) {
      case 'application':
        return status === 'approved' ? 
          <CheckCircleSolidIcon className="w-4 h-4 text-blue-600" /> :
          <ClockIcon className="w-4 h-4 text-blue-500" />
      case 'property':
        return <EyeIcon className="w-4 h-4 text-blue-500" />
      case 'message':
        return <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />
      default:
        return <InformationCircleIcon className="w-4 h-4 text-gray-500" />
    }
  }

  // Enhanced role-specific stats
  const getStats = () => {
    if (profile?.role === 'tenant') {
      return {
        applications: tenantApplications.length,
        pending: tenantApplications.filter(app => app.status === 'pending').length,
        approved: tenantApplications.filter(app => app.status === 'approved').length,
        saved: savedProperties.length
      }
    } else if (profile?.role === 'agent') {
      const totalViews = properties.reduce((sum, prop) => sum + (prop.view_count || 0), 0)
      return {
        properties: properties.length,
        applications: agentApplications.length,
        pending: agentApplications.filter(app => app.status === 'pending').length,
        views: totalViews,
        bookings: agentApplications.filter(app => app.status === 'approved').length
      }
    }
    return {}
  }

  const stats = getStats()

  const getRoleInfo = (role: string, agentStatus?: string): RoleInfo => {
    switch (role) {
      case 'tenant':
        return {
          icon: <AcademicCapIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />,
          color: 'blue',
          title: 'Tenant',
          description: 'You can browse and apply for accommodation.',
          actions: ['Browse Properties', 'My Applications', 'Saved Properties']
        }
      case 'agent':
        const isActive = agentStatus === 'active'
        const isPendingVerification = agentStatus === 'pending_verification'
        return {
          icon: <BuildingOfficeIcon className={`w-10 h-10 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500 dark:text-blue-300'}`} />,
          color: isActive ? 'blue' : 'blue',
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
          icon: <UserIcon className="w-10 h-10 text-gray-600 dark:text-gray-400" />,
          color: 'gray',
          title: 'User',
          description: 'Your dashboard is ready.',
          actions: ['Update Profile']
        }
    }
  }

  const roleInfo = getRoleInfo(profile?.role || 'tenant', profile?.agent_status)

  const StatCard = ({ title, value, icon, trend, color = 'blue' }: {
    title: string
    value: number | string
    icon: React.ReactNode
    trend?: { value: number; direction: 'up' | 'down' }
    color?: string
  }) => {
    const colorClasses = {
      blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      white: 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800'
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 touch-manipulation">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-medium ${
              trend.direction === 'up' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {trend.direction === 'up' ? '+' : '-'}{trend.value}%
            </span>
          )}
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{title}</div>
        </div>
      </div>
    )
  }

  if (profile?.role === 'tenant') {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Quick Stats - Mobile-first grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <StatCard
            title="Applications"
            value={stats.applications || 0}
            icon={<DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={stats.pending || 0}
            icon={<ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <StatCard
            title="Approved"
            value={stats.approved || 0}
            icon={<CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <StatCard
            title="Saved"
            value={stats.saved || 0}
            icon={<HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
        </div>

        {/* Recent Activity - Mobile optimized */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 px-1">Recent Activity</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors touch-manipulation">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                        {getStatusIcon(activity.type, activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center">
                <ClockIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (profile?.role === 'agent') {
    const isActive = profile.agent_status === 'active'
    
    if (!isActive) {
      return (
        <div className="space-y-6 sm:space-y-8">
          {/* Agent Status Banner - Mobile optimized */}
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 ${
            profile.agent_status === 'pending_verification'
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
              <div className="sm:mr-6">
                {profile.agent_status === 'pending_verification' ? (
                  <ExclamationTriangleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400" />
                ) : (
                  <BuildingOfficeIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.agent_status === 'pending_verification' ? 'Verification in Progress' : 'Activate Your Agent Account'}
                </h1>
                <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
                  {profile.agent_status === 'pending_verification'
                    ? 'Your payment is being verified. This may take up to 24 hours.'
                    : 'Complete payment to start managing property listings for clients.'
                  }
                </p>
                {profile.agent_status !== 'pending_verification' && (
                  <button
                    onClick={() => router.push('/dashboard/payment')}
                    className="mt-4 inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[48px]"
                  >
                    Complete Payment
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Agent Stats - Mobile-first responsive grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Properties"
            value={stats.properties || 0}
            icon={<HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <StatCard
            title="Applications"
            value={stats.applications || 0}
            icon={<DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={stats.pending || 0}
            icon={<ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <StatCard
            title="Total Views"
            value={stats.views || 0}
            icon={<EyeIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <StatCard
            title="Bookings"
            value={stats.bookings || 0}
            icon={<CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
        </div>

        {/* Property Performance - Mobile optimized */}
        {properties.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 px-1">Top Performing Properties</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {properties.slice(0, 3).map((property) => (
                  <div key={property.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors touch-manipulation">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{property.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <MapPinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{property.location}</span>
                          </div>
                          <div className="flex items-center">
                            <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            {property.view_count || 0} views
                          </div>
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            ${Number(property.price).toFixed(2)}/mo
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/manage-properties/${property.id}`)}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation min-h-[44px]"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default case for other roles
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Default Overview - Mobile optimized */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
        <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to UniStay
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Your dashboard is ready. Please update your profile to get started.
        </p>
      </div>
    </div>
  )
}
