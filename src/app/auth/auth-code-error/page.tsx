'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">UniStay</h1>
          </Link>
          <p className="text-gray-600 dark:text-gray-300">Account Activation Error</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Activation Link Expired or Invalid
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The activation link you clicked has expired or is invalid. This can happen if the link is old or has already been used.
          </p>
          
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
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
