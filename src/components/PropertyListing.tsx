'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PropertyCard from './PropertyCard'

interface Property {
  id: string
  title: string
  description?: string | null
  location?: string | null
  price?: number
  bedrooms?: number | null
  bathrooms?: number | null
  property_type?: string | null
  image_url?: string | null
  image_urls?: string[] | null
  has_internet?: boolean
  has_parking?: boolean
  has_air_conditioning?: boolean
  is_furnished?: boolean
  has_pool?: boolean
  has_power?: boolean
  has_water?: boolean
  has_tv?: boolean
  has_laundry?: boolean
  has_security_system?: boolean
  view_count?: number
  created_at?: string
  owner_id?: string
}

interface PropertyListingProps {
  limit?: number
  showTitle?: boolean
  showViewAll?: boolean
}

export default function PropertyListing({ limit = 12, showTitle = true, showViewAll = false }: PropertyListingProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties')
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }
        const data = await response.json()
        setProperties(data.properties.slice(0, limit))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [limit])

  const handleApply = (propertyId: string) => {
    // Store the property ID they're trying to apply to
    if (typeof window !== 'undefined') {
      localStorage.setItem('redirect_after_auth', `/dashboard?apply=${propertyId}`)
    }
    // Redirect to signup with a note about applying
    router.push('/auth/signup?intent=apply')
  }

  if (loading) {
    return (
      <div className="py-16">
        {showTitle && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Featured Properties
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover the perfect accommodation for your university life
            </p>
          </div>
        )}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16">
        {showTitle && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Featured Properties
            </h2>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center">
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="py-16">
        {showTitle && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Featured Properties
            </h2>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No properties available</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for new listings
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Featured Properties
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover the perfect accommodation for your university life. Browse our selection of student-friendly properties.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onApply={handleApply}
            />
          ))}
        </div>
        
        {properties.length === limit && (
          <div className="text-center mt-12">
            <button
              onClick={() => {
                if (showViewAll) {
                  router.push('/dashboard?tab=browse');
                } else {
                  router.push('/auth/signup?intent=browse');
                }
              }}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showViewAll ? 'View All Properties' : 'Sign Up to View More Properties'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
