
import Link from 'next/link'

export default function PleaseConfirmPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center text-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Confirm your email
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            We&apos;ve sent a confirmation link to your email address. Please check your inbox (and spam folder!) to complete the sign-up process.
          </p>
          <Link href="/auth/login" className="w-full inline-block py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
              Got it, take me to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
