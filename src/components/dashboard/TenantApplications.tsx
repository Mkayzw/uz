import { Application } from '@/types/dashboard'
import { downloadReceipt, isIOS } from '@/lib/utils/downloadHelpers'
import { useToast } from '@/components/ToastManager'
import ReceiptCard from './ReceiptCard'

interface TenantApplicationsProps {
  applications: Application[]
  onVerifyPayment: (applicationId: string) => void
}

export default function TenantApplications({ applications, onVerifyPayment }: TenantApplicationsProps) {
  const { addToast } = useToast()
  if (applications.length === 0) {
    return (
      <div className="text-center bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-6 sm:p-8">
        <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No applications yet</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          You haven't applied to any properties yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {applications.map((application) => (
        <div key={application.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-2">
                {application.property?.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {application.property?.location}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Applied {new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${
                application.status === 'pending'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : application.status === 'approved'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {application.status}
              </span>
              {application.status === 'approved' && (
                <>
                  {application.transaction_code ? (
                    <div className="mt-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-300 mb-2">
                        <span className="font-medium block sm:inline">Transaction Code:</span>
                        <span className="font-mono text-xs block sm:inline sm:ml-1 break-all">{application.transaction_code}</span>
                      </p>
                      {application.payment_verified ? (
                        <div className="mt-3">
                          <div className="flex items-center text-blue-600 dark:text-blue-400 mb-3">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-medium">Payment verified</span>
                          </div>
                          <ReceiptCard application={application} className="border-blue-100 dark:border-blue-900/30" />
                        </div>
                      ) : (
                        <div className="flex items-center mt-3">
                          <button
                            onClick={() => onVerifyPayment(application.id)}
                            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 touch-manipulation min-h-[40px]"
                          >
                            Verify Payment
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                            🎉 Application Approved!
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Complete your payment to secure your place
                          </p>
                        </div>
                        <button
                          onClick={() => window.location.href = `/dashboard/payment?application_id=${application.id}&type=rent`}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap touch-manipulation min-h-[44px]"
                        >
                          Pay Now
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
