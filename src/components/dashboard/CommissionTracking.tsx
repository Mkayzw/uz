import { Application } from '@/types/dashboard'
import { calculateCommission } from '@/lib/utils/commission'

interface CommissionTrackingProps {
  agentApplications: Application[]
}

export default function CommissionTracking({ agentApplications }: CommissionTrackingProps) {
  const totalEarned = calculateCommission(agentApplications.length)
  const paidOut = 0.00 // This would come from a database in a real app
  const pending = totalEarned - paidOut

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Commission Tracking</h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              ${totalEarned.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Earned</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              ${paidOut.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Paid Out</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-500">
              ${pending.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
        </div>
        <div className="mt-8">
          <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Request Payout
          </button>
        </div>
      </div>
    </div>
  )
}
