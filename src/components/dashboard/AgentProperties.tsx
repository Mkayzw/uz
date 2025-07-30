import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { Property } from '@/types/dashboard'
import PropertyImage from '@/components/PropertyImage'
import { getImageUrl } from '@/lib/utils/imageHelpers'
import { unpublishProperty, publishProperty } from '@/app/dashboard/actions'

interface AgentPropertiesProps {
  properties: Property[]
  onImageClick: (src: string | null, alt: string, allImages?: string[], index?: number) => void
  onRefreshData?: () => void
}

interface PropertyImageCarouselProps {
  property: Property
  onImageClick: (src: string | null, alt: string) => void
}

function PropertyImageCarousel({ property, onImageClick }: PropertyImageCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndY = useRef<number>(0)

  // Get all available images
  const allImages: string[] = []
  if (property.image_url) {
    allImages.push(property.image_url)
  }
  if (property.image_urls && property.image_urls.length > 0) {
    // Add additional images, avoiding duplicates
    property.image_urls.forEach(url => {
      if (url && url !== property.image_url) {
        allImages.push(url)
      }
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchStartY.current = e.targetTouches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
    touchEndY.current = e.targetTouches[0].clientY
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return

    const deltaX = touchStartX.current - touchEndX.current
    const deltaY = touchStartY.current - touchEndY.current
    const minSwipeDistance = 30 // Reduced for better mobile sensitivity

    // Only handle horizontal swipes if they're more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && allImages.length > 1) {
        // Swipe left - next image
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
      } else if (deltaX < 0 && allImages.length > 1) {
        // Swipe right - previous image
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
      }
    }
  }

  const nextImage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <div className="relative overflow-hidden rounded-t-2xl">
      {/* Main image container - optimized for mobile touch */}
      <div
        className="w-full h-48 sm:h-40 relative touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onImageClick(
          getImageUrl(allImages[currentImageIndex] || null),
          property.title
        )}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y pinch-zoom' // Allow vertical scroll but handle horizontal swipes
        }}
      >
        <PropertyImage
          src={getImageUrl(allImages[currentImageIndex] || null)}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 pointer-events-none"
        />

        {/* Mobile-first overlay for better touch feedback */}
        <div className="absolute inset-0 bg-transparent" />
      </div>

      {/* Mobile-optimized navigation - larger touch targets */}
      {allImages.length > 1 && (
        <>
          {/* Navigation arrows - hidden on mobile, visible on larger screens */}
          <button
            onClick={prevImage}
            onTouchEnd={prevImage}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all touch-manipulation items-center justify-center"
            style={{ WebkitTouchCallout: 'none' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextImage}
            onTouchEnd={nextImage}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all touch-manipulation items-center justify-center"
            style={{ WebkitTouchCallout: 'none' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Mobile-first image indicators - larger touch targets */}
      {allImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImageIndex(index)
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                setCurrentImageIndex(index)
              }}
              className={`w-3 h-3 sm:w-2 sm:h-2 rounded-full transition-all touch-manipulation ${
                index === currentImageIndex
                  ? 'bg-white shadow-lg'
                  : 'bg-white bg-opacity-60'
              }`}
              style={{ WebkitTouchCallout: 'none', minWidth: '12px', minHeight: '12px' }}
            />
          ))}
        </div>
      )}

      {/* Image counter - positioned for mobile readability */}
      {allImages.length > 1 && (
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
          {currentImageIndex + 1}/{allImages.length}
        </div>
      )}


    </div>
  )
}

export default function AgentProperties({ properties, onImageClick, onRefreshData }: AgentPropertiesProps) {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({})

  const handleUnpublish = async (propertyId: string) => {
    if (loadingStates[propertyId]) return

    setLoadingStates(prev => ({ ...prev, [propertyId]: true }))

    try {
      const result = await unpublishProperty(propertyId)
      if (result.error) {
        alert('Failed to unpublish property: ' + result.error)
      } else {
        // Use Next.js router refresh for better UX
        if (onRefreshData) {
          onRefreshData()
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      alert('Failed to unpublish property')
    } finally {
      setLoadingStates(prev => ({ ...prev, [propertyId]: false }))
    }
  }

  const handlePublish = async (propertyId: string) => {
    if (loadingStates[propertyId]) return

    setLoadingStates(prev => ({ ...prev, [propertyId]: true }))

    try {
      const result = await publishProperty(propertyId)
      if (result.error) {
        alert('Failed to publish property: ' + result.error)
      } else {
        // Use Next.js router refresh for better UX
        if (onRefreshData) {
          onRefreshData()
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      alert('Failed to publish property')
    } finally {
      setLoadingStates(prev => ({ ...prev, [propertyId]: false }))
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Property Listings</h3>
        <button
          onClick={() => router.push('/dashboard/list-property')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>
      
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col">
              <PropertyImageCarousel
                property={property}
                onImageClick={onImageClick}
              />
              <div className="p-4 sm:p-6 flex-grow flex flex-col">
                <div className="flex-grow">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">{property.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{property.location}</p>
                  {property.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {property.description}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {property.view_count || 0} {property.view_count === 1 ? 'view' : 'views'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      property.active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {property.active ? 'Published' : 'Unpublished'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => router.push(`/dashboard/edit-property/${property.id}`)}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                    >
                      Edit
                    </button>
                    {property.active ? (
                      <button
                        onClick={() => handleUnpublish(property.id)}
                        disabled={loadingStates[property.id]}
                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingStates[property.id] ? 'Unpublishing...' : 'Unpublish'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(property.id)}
                        disabled={loadingStates[property.id]}
                        className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingStates[property.id] ? 'Publishing...' : 'Publish'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No properties</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new property listing
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard/list-property')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Property
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => router.push('/dashboard/manage-properties')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          View All Properties
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
