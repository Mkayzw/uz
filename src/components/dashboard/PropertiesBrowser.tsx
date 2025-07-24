import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Property, Application, SavedProperty, UserProfile } from '@/types/dashboard'
import PropertyImage from '@/components/PropertyImage'
import { getImageUrl } from '@/lib/utils/imageHelpers'

interface PropertiesBrowserProps {
  allProperties: Property[]
  applications: Application[]
  savedProperties: SavedProperty[]
  profile: UserProfile | null
  onApplyToProperty: (propertyId: string) => void
  onCancelApplication: (applicationId: string) => void
  onSaveProperty: (propertyId: string) => void
  onUnsaveProperty: (propertyId: string) => void
  onImageClick: (src: string | null, alt: string) => void
}

interface PropertyImageCarouselProps {
  property: Property
  onImageClick: (src: string | null, alt: string) => void
  height?: string
}

function PropertyImageCarousel({ property, onImageClick, height = "h-48" }: PropertyImageCarouselProps) {
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
      {/* Main image container - mobile-first with responsive height */}
      <div
        className={`w-full ${height} sm:h-48 relative touch-manipulation`}
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

      {/* Navigation buttons - visible on all screen sizes */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            onTouchEnd={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all touch-manipulation flex items-center justify-center"
            style={{ WebkitTouchCallout: 'none' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextImage}
            onTouchEnd={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all touch-manipulation flex items-center justify-center"
            style={{ WebkitTouchCallout: 'none' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image counter - positioned for mobile readability */}
      {allImages.length > 1 && (
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
          {currentImageIndex + 1}/{allImages.length}
        </div>
      )}

      {/* Mobile swipe hint - only show on first load */}
      {allImages.length > 1 && currentImageIndex === 0 && (
        <div className="sm:hidden absolute bottom-8 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full animate-pulse">
          Swipe to see more
        </div>
      )}
    </div>
  )
}

export default function PropertiesBrowser({
  allProperties,
  applications,
  savedProperties,
  profile,
  onApplyToProperty,
  onCancelApplication,
  onSaveProperty,
  onUnsaveProperty,
  onImageClick
}: PropertiesBrowserProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [typeFilter, setTypeFilter] = useState<string>('')

  const filteredProperties = useMemo(() => {
    return allProperties.filter(property => {
      const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.location?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPrice = !property.price || (property.price >= priceRange[0] && property.price <= priceRange[1])
      const matchesType = !typeFilter || property.property_type === typeFilter
      return matchesSearch && matchesPrice && matchesType
    })
  }, [allProperties, searchTerm, priceRange, typeFilter])

  const isPropertySaved = (propertyId: string) => {
    return savedProperties.some(sp => sp.bed_id === propertyId)
  }

  const hasAppliedToProperty = (propertyId: string) => {
    return applications.some(app => app.bed_id === propertyId && app.status !== 'cancelled')
  }

  const handleApplyClick = (property: Property) => {
    if (hasAppliedToProperty(property.id)) {
      const application = applications.find(app => app.bed_id === property.id)
      if (application) {
        onCancelApplication(application.id)
      }
    } else {
      onApplyToProperty(property.id)
    }
  }

  const handleSaveClick = (propertyId: string) => {
    if (isPropertySaved(propertyId)) {
      onUnsaveProperty(propertyId)
    } else {
      onSaveProperty(propertyId)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Browse Properties</h3>
        
        {/* Search and Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Properties
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or location..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="property-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Type
              </label>
              <select
                id="property-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Room</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProperties.map((property) => (
          <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <PropertyImageCarousel
              property={property}
              onImageClick={onImageClick}
              height="h-48"
            />
            <div className="p-4 sm:p-6">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{property.title}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{property.location}</p>

              {property.description && (
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                  {property.description}
                </p>
              )}

              {property.price && (
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  ${property.price}/month
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {property.bedrooms && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                    {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                  </span>
                )}
                {property.bathrooms && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                    {property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}
                  </span>
                )}
                {/* Room availability status */}
                {property.total_rooms && property.total_rooms > 0 && (
                  <>
                    {property.full_rooms && property.full_rooms > 0 && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full font-bold">
                        {property.full_rooms} FULL
                      </span>
                    )}
                    {property.available_rooms && property.available_rooms > 0 && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                        {property.available_rooms} Available
                      </span>
                    )}
                  </>
                )}
                {property.has_internet && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    📶 WiFi
                  </span>
                )}
                {property.has_parking && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    🅿️ Parking
                  </span>
                )}
                {property.has_power && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    ⚡ Power
                  </span>
                )}
                {property.has_water && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    💧 Water
                  </span>
                )}
                {property.is_furnished && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    🛋️ Furnished
                  </span>
                )}
                {property.has_parking && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    Parking
                  </span>
                )}
                {property.is_furnished && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    Furnished
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                {profile?.role === 'tenant' && (
                  <>
                    <button
                      onClick={() => handleApplyClick(property)}
                      disabled={false}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        hasAppliedToProperty(property.id)
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {hasAppliedToProperty(property.id) ? 'Cancel Application' : 'Apply'}
                    </button>
                    <button
                      onClick={() => handleSaveClick(property.id)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isPropertySaved(property.id)
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {isPropertySaved(property.id) ? 'Unsave' : 'Save'}
                    </button>
                  </>
                )}
                {profile?.role === 'agent' && property.created_by === profile.id && (
                  <button
                    onClick={() => router.push(`/dashboard/manage-properties/${property.id}`)}
                    className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria or check back later for new listings.
          </p>
        </div>
      )}
    </div>
  )
}
