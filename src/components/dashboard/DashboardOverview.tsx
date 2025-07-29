import { useRouter } from 'next/navigation'
import { UserProfile, Property, Application, RoleInfo, DashboardTab } from '@/types/dashboard'
import { AcademicCapIcon, BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline'

interface DashboardOverviewProps {
  profile: UserProfile | null
  properties: Property[]
  agentApplications: Application[]
  setActiveTab: (tab: DashboardTab) => void
  onBrowseProperties: () => void
}

export default function DashboardOverview({ 
  profile, 
  properties, 
  agentApplications, 
  setActiveTab,
  onBrowseProperties 
}: DashboardOverviewProps) {
  const router = useRouter()

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
          icon: <BuildingOfficeIcon className={`w-10 h-10 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400'}`} />,
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
          icon: <UserIcon className="w-10 h-10 text-gray-600 dark:text-gray-400" />,
          color: 'gray',
          title: 'User',
          description: 'Your dashboard is ready.',
          actions: ['Update Profile']
        }
    }
  }

  const roleInfo = getRoleInfo(profile?.role || 'tenant', profile?.agent_status)
  const pendingApplicationsCount = agentApplications.filter(app => app.status === 'pending').length
  const bookingsCount = agentApplications.filter(app => app.status === 'approved').length

  const handleActionClick = (action: string) => {
    if (action.includes('Browse')) {
      onBrowseProperties()
    } else if (action.includes('Add')) {
      router.push('/dashboard/list-property')
    } else if (action.includes('Manage')) {
      router.push('/dashboard/manage-properties')
    } else if (action.includes('Payment')) {
      router.push('/dashboard/payment')
    } else if (action.includes('Applications')) {
      setActiveTab('applications')
    } else if (action.includes('Saved')) {
      setActiveTab('saved')
    } else if (action.includes('Commission')) {
      setActiveTab('commission')
    }
  }

  const getActionDescription = (action: string) => {
    if (action.includes('Browse')) return 'Discover available properties near UZ campus.'
    if (action.includes('Add')) return 'List a new property for students.'
    if (action.includes('Manage')) return 'View and update your existing listings.'
    if (action.includes('Applications')) return 'Track your property applications.'
    if (action.includes('Payment')) return 'Activate your agent account.'
    if (action.includes('Profile')) return 'Update your account information.'
    if (action.includes('Commission')) return 'Track your earnings and payments.'
    if (action.includes('Client')) return 'Manage your client relationships.'
    if (action.includes('Pricing')) return 'View agent subscription plans.'
    if (action.includes('Support')) return 'Get help with your account.'
    if (action.includes('Saved')) return 'View your bookmarked properties.'
    return ''
  }

  return (
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
          <div className="mr-4">{roleInfo.icon}</div>
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
                  {profile.agent_status === 'active' ? 'Active' : 
                   profile.agent_status === 'pending_verification' ? 'Pending Verification' : 
                   'Pending Payment'}
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
              {getActionDescription(action)}
            </p>
            <button
              onClick={() => handleActionClick(action)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {action}
            </button>
          </div>
        ))}
      </div>

      {/* Stats Section for Agents */}
      {(profile?.role === 'agent' && profile?.agent_status === 'active') && (
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
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{pendingApplicationsCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{bookingsCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bookings</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
