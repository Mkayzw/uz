'use client'

import Link from 'next/link'
import { XCircleIcon } from '@heroicons/react/24/outline'
import { useSearchParams } from 'next/navigation'

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const message = searchParams.get('message')
  const error = searchParams.get('error')
  const desc = searchParams.get('desc')

  const getErrorMessage = () => {
    if (reason === 'exchange_failed') {
      return `Sign-in failed: ${message || 'Unknown error during authentication'}`
    }
    if (reason === 'missing_code') {
      return 'Sign-in failed: No authorization code received from provider'
    }
    if (error || desc) {
      return `Provider error: ${error || 'Unknown'} - ${desc || 'No description'}`
    }
    return 'The sign-in link has expired or is invalid. This can happen if the link is old or has already been used.'
  }

  const getTitle = () => {
    if (reason || error) {
      return 'Sign-in Error'
    }
    return 'Activation Link Expired or Invalid'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">UniStay</h1>
          </Link>
          <p className="text-gray-600 dark:text-gray-300">Authentication Error</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <XCircleIcon className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {getTitle()}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getErrorMessage()}
          </p>

          {(reason || error) && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Debug: {reason || error} {message && `- ${message}`}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/auth/signup"
              className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Create New Account
            </Link>
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Try Sign In Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
