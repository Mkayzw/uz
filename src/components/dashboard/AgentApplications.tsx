import { Application } from '@/types/dashboard'
import { downloadReceipt, isIOS } from '@/lib/utils/downloadHelpers'
import { useToast } from '@/components/ToastManager'
import ReceiptCard from './ReceiptCard'
import { useState } from 'react'

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
  const { addToast } = useToast()
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

              {/* Tenant Information Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Applicant Details</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {application.tenant?.full_name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Gender:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {application.tenant?.gender ?
                        application.tenant.gender.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Student ID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono">
                      {application.tenant?.registration_number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">National ID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono">
                      {application.tenant?.national_id || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                application.status === 'pending'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : application.status === 'approved'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
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
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 text-xs rounded-full">
                    Pending Verification
                  </span>
                )}
              </div>
              
              {application.transaction_code ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transaction Code:</p>
                      <p className="font-mono font-medium text-gray-800 dark:text-gray-200 break-all">{application.transaction_code}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {!application.payment_verified && (
                        <button
                          onClick={() => onVerifyPayment(application.id)}
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap"
                        >
                          Verify Payment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Show Receipt Card for verified payments */}
                  {application.payment_verified && (
                    <div className="mt-2">
                      <ReceiptCard application={application} className="border-blue-100 dark:border-blue-900/30" />
                    </div>
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
