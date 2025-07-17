import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'

interface DashboardAccountProps {
  user: User | null
  profile: UserProfile | null
  onSignOut: () => void
  onUpdateEcocash: (ecocashNumber: string) => Promise<void>
}

export default function DashboardAccount({ 
  user, 
  profile, 
  onSignOut, 
  onUpdateEcocash 
}: DashboardAccountProps) {
  const [ecocashNumber, setEcocashNumber] = useState<string>(profile?.ecocash_number || '')
  const [updatingEcocash, setUpdatingEcocash] = useState(false)

  const handleUpdateEcocash = async () => {
    if (!ecocashNumber.trim()) return
    
    setUpdatingEcocash(true)
    try {
      await onUpdateEcocash(ecocashNumber)
    } finally {
      setUpdatingEcocash(false)
    }
  }

  return (
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
              {profile?.role === 'agent' && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">EcoCash Number</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ecocashNumber}
                      onChange={(e) => setEcocashNumber(e.target.value)}
                      placeholder="e.g., 0777123456"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <button
                      onClick={handleUpdateEcocash}
                      disabled={updatingEcocash}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {updatingEcocash ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
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
              onClick={onSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
