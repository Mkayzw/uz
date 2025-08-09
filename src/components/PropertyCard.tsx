'use client'

import { useState, useRef } from 'react'
import PropertyImage from './PropertyImage'
import { getImageUrl } from '@/lib/utils/imageHelpers'
import {
  WifiIcon,
  TruckIcon,
  HomeIcon,
  CircleStackIcon,
  BoltIcon,
  BeakerIcon,
  TvIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  // Better icon for air conditioning
  CloudIcon 
} from '@heroicons/react/24/outline'

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
}

interface PropertyCardProps {
  property: Property
  onApply: (propertyId: string) => void
}

export default function PropertyCard({ property, onApply }: PropertyCardProps) {
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; src: string; alt: string; index: number }>({
    isOpen: false,
    src: '',
    alt: '',
    index: 0,
  })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentExpandedDescription, setCurrentExpandedDescription] = useState(false)

  // Touch handling for swipe
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

  const openImageModal = (src: string | null, alt: string, index: number = currentImageIndex) => {
    if (src) {
      setImageModal({ isOpen: true, src, alt, index })
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  // Touch event handlers for swipe
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
    const minSwipeDistance = 30

    // Only handle horizontal swipes if they're more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && allImages.length > 1) {
        nextImage()
      } else if (deltaX < 0 && allImages.length > 1) {
        prevImage()
      }
    }
  }

  const amenities = [
    { key: 'has_internet', label: 'WiFi', icon: <WifiIcon className="w-4 h-4" /> },
    { key: 'has_parking', label: 'Parking', icon: <TruckIcon className="w-4 h-4" /> },
    { key: 'has_air_conditioning', label: 'AC', icon: <CloudIcon className="w-4 h-4" /> },
    { key: 'is_furnished', label: 'Furnished', icon: <HomeIcon className="w-4 h-4" /> },
    { key: 'has_pool', label: 'Pool', icon: <CircleStackIcon className="w-4 h-4" /> },
    { key: 'has_power', label: 'Power', icon: <BoltIcon className="w-4 h-4" /> },
    { key: 'has_water', label: 'Water', icon: <BeakerIcon className="w-4 h-4" /> },
    { key: 'has_tv', label: 'TV', icon: <TvIcon className="w-4 h-4" /> },
    { key: 'has_laundry', label: 'Laundry', icon: <ArrowPathIcon className="w-4 h-4" /> },
    { key: 'has_security_system', label: 'Security', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  ]

  const availableAmenities = amenities.filter(amenity => 
    property[amenity.key as keyof Property] === true
  )

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative">
          <div
            className="w-full h-48 sm:h-56 relative cursor-pointer touch-manipulation"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => openImageModal(
              getImageUrl(allImages[currentImageIndex] || null),
              property.title,
              currentImageIndex
            )}
            style={{
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'pan-y pinch-zoom'
            }}
          >
            <PropertyImage
              src={getImageUrl(allImages[currentImageIndex] || null)}
              alt={property.title}
              className="w-full h-full object-cover pointer-events-none"
            />
          </div>
          
          {/* Property Type Badge */}
          {property.property_type && (
            <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
              {property.property_type}
            </span>
          )}
          
          {/* Image Navigation */}
          {allImages.length > 1 && (
            <>
              {/* Navigation buttons - hidden on mobile, visible on larger screens */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                }}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all z-10 touch-manipulation items-center justify-center"
                style={{ WebkitTouchCallout: 'none' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                }}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all z-10 touch-manipulation items-center justify-center"
                style={{ WebkitTouchCallout: 'none' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Image Counter */}
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs z-10">
                {currentImageIndex + 1}/{allImages.length}
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 sm:p-6">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">{property.title}</h3>
          
          {property.location && (
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 flex items-center">
              <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {property.location}
            </p>
          )}
          
          {property.description && (
            <div className="mb-4">
              {currentExpandedDescription ? (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                    {property.description}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentExpandedDescription(false);
                    }}
                    className="text-blue-600 dark:text-blue-400 text-xs mt-1 hover:underline focus:outline-none touch-manipulation"
                  >
                    Read less
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm line-clamp-2">
                    {property.description}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentExpandedDescription(true);
                    }}
                    className="text-blue-600 dark:text-blue-400 text-xs mt-1 hover:underline focus:outline-none touch-manipulation"
                  >
                    Read more
                  </button>
                </div>
              )}
            </div>
          )}
          
          {property.price && (
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3 sm:mb-4">
              ${Number(property.price).toFixed(2)}/mo
            </p>
          )}
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {/* Bedrooms */}
            {property.bedrooms ? (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                {Math.floor(Number(property.bedrooms))} bed{Number(property.bedrooms) > 1 ? 's' : ''}
              </span>
            ) : null}
            
            {/* Bathrooms */}
            {property.bathrooms ? (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                {Math.floor(Number(property.bathrooms))} bath{Number(property.bathrooms) > 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
          
          {/* Amenities Section - Mobile optimized */}
          <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Amenities:</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {availableAmenities.length > 0 ? (
                availableAmenities.slice(0, 6).map(amenity => (
                  <span
                    key={amenity.key}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {amenity.icon}
                    <span className="hidden sm:inline">{amenity.label}</span>
                    <span className="sm:hidden">{amenity.label.slice(0, 3)}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No amenities listed</span>
              )}
              {availableAmenities.length > 6 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                  +{availableAmenities.length - 6} more
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onApply(property.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-[40px] text-sm sm:text-base"
            >
              Apply Now
            </button>
            <button
              onClick={() => openImageModal(
                getImageUrl(allImages[currentImageIndex] || null),
                property.title,
                currentImageIndex
              )}
              className="px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px] sm:min-h-[40px] text-sm sm:text-base"
              style={{ WebkitTouchCallout: 'none' }}
            >
              <span className="sm:hidden">View</span>
              <span className="hidden sm:inline">View {allImages.length > 1 ? `(${allImages.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Image Modal with Navigation */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 touch-manipulation"
          onClick={() => setImageModal({ isOpen: false, src: '', alt: '', index: 0 })}
          style={{ WebkitTouchCallout: 'none' }}
        >
          <div className="relative max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <PropertyImage
              src={imageModal.src}
              alt={imageModal.alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg pointer-events-none"
              fallbackSrc="/file.svg"
            />
            
            {/* Close Button */}
            <button
              onClick={() => setImageModal({ isOpen: false, src: '', alt: '', index: 0 })}
              className="absolute top-6 right-6 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors touch-manipulation"
              style={{ WebkitTouchCallout: 'none' }}
            >
              ×
            </button>
            
            {/* Navigation for multiple images */}
            {allImages.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newIndex = (imageModal.index - 1 + allImages.length) % allImages.length
                    setImageModal({
                      ...imageModal,
                      src: getImageUrl(allImages[newIndex]),
                      index: newIndex
                    })
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all touch-manipulation"
                  style={{ WebkitTouchCallout: 'none' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Next Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newIndex = (imageModal.index + 1) % allImages.length
                    setImageModal({
                      ...imageModal,
                      src: getImageUrl(allImages[newIndex]),
                      index: newIndex
                    })
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all touch-manipulation"
                  style={{ WebkitTouchCallout: 'none' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">
                  {imageModal.index + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
