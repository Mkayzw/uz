import { DashboardTab, UserProfile } from '@/types/dashboard'

interface DashboardTabsProps {
  activeTab: DashboardTab
  setActiveTab: (tab: DashboardTab) => void
  profile: UserProfile | null
}

export default function DashboardTabs({ activeTab, setActiveTab, profile }: DashboardTabsProps) {
  const tabs = [
    { id: 'overview' as DashboardTab, label: 'Overview', show: true },
    { id: 'browse' as DashboardTab, label: 'Browse Properties', show: true },
    { 
      id: 'properties' as DashboardTab, 
      label: 'My Properties', 
      show: profile?.role === 'agent' && profile?.agent_status === 'active' 
    },
    { id: 'applications' as DashboardTab, label: 'Applications', show: true },
    { 
      id: 'saved' as DashboardTab, 
      label: 'Saved Properties', 
      show: profile?.role === 'tenant' 
    },
    { id: 'account' as DashboardTab, label: 'Account', show: true },
    { 
      id: 'commission' as DashboardTab, 
      label: 'Commission Tracking', 
      show: profile?.role === 'agent' && profile?.agent_status === 'active' 
    }
  ].filter(tab => tab.show)

  return (
    <div className="mb-8">
      {/* Mobile Tab Navigation */}
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">Select a tab</label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as DashboardTab)}
        >
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden sm:block">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
