'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function SupportPageClient() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Logo variant="full" size="md" href="/" className="group hover:scale-105 transition-transform duration-200" />
            </div>

            {/* Back to Home */}
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Support Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-8">
            <EnvelopeIcon className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Support
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Need help? We're here to assist you with any questions or issues you may have.
          </p>

          {/* Contact Card */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Get in Touch
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-400">Email us at:</span>
              </div>
              
              <a 
                href="mailto:support@unistay.online"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                support@unistay.online
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We typically respond within 24 hours
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              For urgent matters, please include "URGENT" in your email subject line.
            </p>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">What is Unistay?</h3>
                <p className="text-gray-600 dark:text-gray-400">Unistay is a platform that helps students find accommodation near their universities. We verify all properties to ensure they meet our standards.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">How do I apply for a property?</h3>
                <p className="text-gray-600 dark:text-gray-400">You can apply for a property by clicking the "Apply Now" button on the property listing page. You will be asked to fill out a form and submit it for review.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Can I schedule a viewing?</h3>
                <p className="text-gray-600 dark:text-gray-400">Yes, you can schedule a viewing by contacting the agent through the contact form on the property listing page.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}