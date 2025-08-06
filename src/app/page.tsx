'use client'

import Link from 'next/link'
import PropertyListing from '@/components/PropertyListing'
import Logo from '@/components/Logo'
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
              <Logo variant="full" size="md" href="/" className="group hover:scale-105 transition-transform duration-200" />
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/support"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
              >
                Support
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
      <div className="relative bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8">
          <div className="px-6 pt-10 pb-24 sm:pb-32 lg:col-span-7 lg:px-0 lg:pt-40 lg:pb-48 xl:col-span-6">
            <div className="mx-auto max-w-lg lg:mx-0">

              <div className="hidden sm:mt-32 sm:flex lg:mt-16">
                <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-500 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-400 dark:ring-gray-700">
                  Trusted by 500+ students and growing.{' '}
                  <a href="#properties" className="font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">
                    <span aria-hidden="true" className="absolute inset-0" />
                    Browse properties <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>

              <h1 className="mt-24 text-5xl font-semibold tracking-tight text-pretty text-gray-900 dark:text-white sm:mt-10 sm:text-7xl">
                Find Your Perfect Home, Faster.
              </h1>

              <p className="mt-8 text-lg font-medium text-pretty text-gray-500 dark:text-gray-400 sm:text-xl/8">
                The #1 platform for students to discover safe, affordable, and convenient off-campus housing.
              </p>

              <div className="mt-10 flex items-center gap-x-6">
                <a
                  href="#properties"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Browse Properties
                </a>
                <Link href="/auth/signup?role=agent" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
                  List a Property <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="relative lg:col-span-5 lg:-mr-8 xl:absolute xl:inset-0 xl:left-1/2 xl:mr-0">
            <img
              alt="Student off-campus housing"
              src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
              className="aspect-3/2 w-full bg-gray-50 object-cover lg:absolute lg:inset-0 lg:aspect-auto lg:h-full"
            />
          </div>
        </div>
      </div>

      {/* Platform Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">A Platform for Everyone</h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">Whether you&apos;re a student or agent, UniStay is built for you.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1: For Students */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 ring-1 ring-gray-900/5 dark:ring-gray-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">For Students</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Secure your ideal room with verified listings, advanced search filters, and direct communication with agents.
              </p>
            </div>

            {/* Card 2: For Property Agents */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 ring-1 ring-gray-900/5 dark:ring-gray-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <HomeIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">For Agents</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Connect with responsible students, manage property listings efficiently, and fill vacancies faster than ever.
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
                href="/support"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Support
              </Link>
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
            <p className="text-gray-400">Built for the student community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
