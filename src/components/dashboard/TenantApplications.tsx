import { Application } from '@/types/dashboard'
import { downloadReceipt, isIOS } from '@/lib/utils/downloadHelpers'
import { useToast } from '@/components/ToastManager'

interface TenantApplicationsProps {
  applications: Application[]
  onVerifyPayment: (applicationId: string) => void
}

export default function TenantApplications({ applications, onVerifyPayment }: TenantApplicationsProps) {
  const { addToast } = useToast()
  if (applications.length === 0) {
    return (
      <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No applications yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You haven't applied to any properties yet.
        </p>
      </div>
    )
  }

  return (
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
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-gray-800 dark:text-gray-300">
                        <span className="font-medium">Transaction Code:</span> {application.transaction_code}
                      </p>
                      {application.payment_verified ? (
                        <div className="flex items-center mt-2 text-blue-600 dark:text-blue-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs font-medium">Payment verified</span>
                          <button
                            onClick={() => downloadReceipt(
                              application.id,
                              (error: string) => {
                                console.error('Download failed:', error)
                                addToast({
                                  title: 'Download Failed',
                                  message: 'Failed to download receipt. Please try again.',
                                  type: 'error',
                                  duration: 5000
                                })
                              },
                              () => {
                                console.log('Receipt downloaded successfully')
                                const isiOS = isIOS()
                                addToast({
                                  title: 'Download Successful',
                                  message: isiOS
                                    ? 'Receipt opened in Safari. Tap the share button to save to Files.'
                                    : 'Receipt downloaded successfully.',
                                  type: 'success',
                                  duration: isiOS ? 6000 : 3000
                                })
                              }
                            )}
                            className="ml-4 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                          >
                            Download Receipt
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() => onVerifyPayment(application.id)}
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                          >
                            Verify Payment
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                            🎉 Application Approved!
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Complete your payment to secure your place
                          </p>
                        </div>
                        <button
                          onClick={() => window.location.href = `/dashboard/payment?application_id=${application.id}&type=rent`}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
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
