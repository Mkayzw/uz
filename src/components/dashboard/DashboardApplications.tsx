import { UserProfile, Application } from '@/types/dashboard'
import TenantApplications from './TenantApplications'
import AgentApplications from './AgentApplications'

interface DashboardApplicationsProps {
  profile: UserProfile | null
  applications: Application[]
  agentApplications: Application[]
  onApproveApplication: (applicationId: string) => void
  onRejectApplication: (applicationId: string) => void
  onVerifyPayment: (applicationId: string) => void
}

export default function DashboardApplications({
  profile,
  applications,
  agentApplications,
  onApproveApplication,
  onRejectApplication,
  onVerifyPayment
}: DashboardApplicationsProps) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {profile?.role === 'tenant' ? 'My Applications' : 'Property Applications'}
      </h3>
      
      {profile?.role === 'tenant' && (
        <TenantApplications 
          applications={applications}
          onVerifyPayment={onVerifyPayment}
        />
      )}

      {profile?.role === 'agent' && (
        <AgentApplications
          applications={agentApplications}
          onApproveApplication={onApproveApplication}
          onRejectApplication={onRejectApplication}
          onVerifyPayment={onVerifyPayment}
        />
      )}
    </div>
  )
}
