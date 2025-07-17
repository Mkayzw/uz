import { Application } from '@/types/dashboard'

interface AgentApplicationsProps {
  applications: Application[]
  onApproveApplication: (applicationId: string) => void
  onRejectApplication: (applicationId: string) => void
  onVerifyPayment: (applicationId: string) => void
}

export default function AgentApplications({ 
  applications, 
  onApproveApplication, 
  onRejectApplication, 
  onVerifyPayment 
}: AgentApplicationsProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No applications yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You haven't received any applications for your properties.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div key={application.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div className="flex-1 mb-4 sm:mb-0">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {application.property?.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Applicant: {application.tenant?.full_name || 'N/A'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                application.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : application.status === 'approved'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {application.status}
              </span>
              {application.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => onApproveApplication(application.id)}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => onRejectApplication(application.id)}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment information section for approved applications */}
          {application.status === 'approved' && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-semibold text-gray-900 dark:text-white">Payment Status</h5>
                {application.payment_verified ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full">
                    Pending Verification
                  </span>
                )}
              </div>
              
              {application.transaction_code ? (
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transaction Code:</p>
                    <p className="font-mono font-medium text-gray-800 dark:text-gray-200">{application.transaction_code}</p>
                  </div>
                  {!application.payment_verified && (
                    <button 
                      onClick={() => onVerifyPayment(application.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      Verify Payment
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Awaiting payment from tenant
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
