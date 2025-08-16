'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PropertyListing from '@/components/PropertyListing'

interface SearchResultsProps {
  searchParams: { q?: string; city?: string; minPrice?: string; maxPrice?: string }
}

export default function SearchResults({ searchParams }: SearchResultsProps) {
  const [resultCount, setResultCount] = useState(0)
  const query = searchParams.q || ''
  const city = searchParams.city || ''
  const minPrice = searchParams.minPrice || ''
  const maxPrice = searchParams.maxPrice || ''

  // Create display query
  const displayQuery = [query, city].filter(Boolean).join(' in ')
  const hasFilters = minPrice || maxPrice

  useEffect(() => {
    // This would typically fetch the actual result count
    // For now, we'll simulate it
    setResultCount(Math.floor(Math.random() * 50) + 10)
  }, [query, city, minPrice, maxPrice])

  return (
    <>
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayQuery ? `Search Results: "${displayQuery}"` : 'Search Results'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {resultCount > 0 ? `Found ${resultCount} properties` : 'No properties found'}
                {hasFilters && ' matching your criteria'}
              </p>
            </div>
            <Link
              href="/search"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Refine Search
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Home
                </Link>
              </li>
              <li>
                <span className="text-gray-400 dark:text-gray-500">/</span>
              </li>
              <li>
                <span className="text-gray-900 dark:text-gray-100 font-medium">Search</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Active Filters */}
      {(query || city || minPrice || maxPrice) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Active filters:
              </span>
              <div className="flex items-center space-x-2">
                {query && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                    Query: {query}
                  </span>
                )}
                {city && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                    City: {city}
                  </span>
                )}
                {minPrice && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                    Min: ${minPrice}
                  </span>
                )}
                {maxPrice && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                    Max: ${maxPrice}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {resultCount > 0 ? (
          <PropertyListing limit={12} showViewAll={false} />
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search criteria or browse all available properties.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse All Properties
              </Link>
              <Link
                href="/locations"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse by Location
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}