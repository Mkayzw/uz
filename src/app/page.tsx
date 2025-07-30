'use client'

import Link from 'next/link'
import PropertyListing from '@/components/PropertyListing'
import { AcademicCapIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-white font-bold text-lg">U</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-500">
                  UniStay
                </span>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/merchant-agreement"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
              >
                Terms
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8">
            Find Your <span className="text-blue-600 dark:text-blue-400">UZ</span> Home, Faster.
          </h1>
          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
            The #1 platform for University of Zimbabwe students to discover safe, affordable, and convenient off-campus housing.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#properties" className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200">
              Browse Properties
            </a>
            <Link href="/auth/signup?role=agent" className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 rounded-xl shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200">
              List a Property
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">A Platform for Everyone</h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">Whether you&apos;re a student or agent, UniStay is built for you.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 text-left max-w-5xl mx-auto">
            {/* Card 1: For UZ Students */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For Students</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Secure your ideal room with verified listings, advanced search filters, and direct communication with agents.
              </p>
            </div>

            {/* Card 2: For Property Agents */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-500 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <HomeIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For Agents</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
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
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-2xl font-bold">UniStay</span>
            </div>

            {/* Footer Links */}
            <div className="flex justify-center space-x-6 mb-6">
              <Link
                href="/merchant-agreement"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Merchant Agreement
              </Link>
              <Link
                href="/changelog"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Changelog
              </Link>
            </div>

            <p className="text-gray-400 mb-2">&copy; {new Date().getFullYear()} UniStay. All rights reserved.</p>
            <p className="text-gray-400">Built for the UZ community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
