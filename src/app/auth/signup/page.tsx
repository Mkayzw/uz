import { Suspense } from 'react'
import SignupFormContent from './SignupFormContent'

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">UniStay</h1>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  )
}

