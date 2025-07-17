'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import PropertyListing from '@/components/PropertyListing'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">UniStay</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/changelog" className="hidden md:inline-block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Changelog
              </Link>
              <Link href="/auth/login" className="hidden md:inline-block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-white mb-6">
            Find Your <span className="text-blue-600 dark:text-blue-400">UZ</span> Home, Faster.
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10">
            The #1 platform for University of Zimbabwe students to discover safe, affordable, and convenient off-campus housing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#properties" className="inline-block px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:-translate-y-1">
              Browse Properties
            </a>
            <Link href="/auth/signup?role=agent" className="inline-block px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-lg shadow-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:-translate-y-1">
              List a Property
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">A Platform for Everyone</h2>
            <p className="max-w-xl mx-auto mt-4 text-gray-600 dark:text-gray-300">Whether you&apos;re a student or agent, UniStay is built for you.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            {/* Card 1: For UZ Students */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-md hover:shadow-2xl transition-shadow duration-300 border border-transparent hover:border-blue-500">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">For Students</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Secure your ideal room with verified listings, advanced search filters, and direct communication with agents.
              </p>
            </div>
            
            {/* Card 2: For Property Agents */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-md hover:shadow-2xl transition-shadow duration-300 border border-transparent hover:border-green-500">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">For Agents</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with responsible UZ students, manage property listings efficiently, and fill vacancies faster than ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Property Listings */}
      <div id="properties">
        <PropertyListing limit={6} showViewAll={true} />
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} UniStay. All rights reserved.</p>
            <p>Built for the UZ community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
