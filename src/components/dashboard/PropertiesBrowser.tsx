import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Property, Application, SavedProperty, UserProfile } from '@/types/dashboard'
import PropertyImage from '@/components/PropertyImage'
import { getImageUrl } from '@/lib/utils/imageHelpers'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  HeartIcon,
  EyeIcon,
  Squares2X2Icon,
  ListBulletIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface PropertiesBrowserProps {
  allProperties: Property[]
  applications: Application[]
  savedProperties: SavedProperty[]
  profile: UserProfile | null
  onApplyToProperty: (propertyId: string) => void
  onCancelApplication: (applicationId: string) => void
  onSaveProperty: (propertyId: string) => void
  onUnsaveProperty: (propertyId: string) => void
  onImageClick: (src: string | null, alt: string, allImages?: string[], initialIndex?: number) => void
}

interface PropertyImageCarouselProps {
  property: Property
  onImageClick: (src: string | null, alt: string, allImages?: string[], initialIndex?: number) => void
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
          property.title,
          allImages,
          currentImageIndex
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [amenityFilters, setAmenityFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest')
  const [showFilters, setShowFilters] = useState(false)

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
      {/* Header with Search and View Toggle */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Properties</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} available
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, location, or description..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Property Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Property Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="hostel">Hostel</option>
                <option value="lodge">Lodge</option>
                <option value="cottage">Cottage</option>
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Price Range: ${priceRange[0]} - ${priceRange[1]} per month
            </label>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>$0</span>
                <span>$5000+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Display */}
      <div className={viewMode === 'grid'
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        : "space-y-6"
      }>
        {filteredProperties.map((property) => (
          viewMode === 'grid' ? (
            // Grid View Card
            <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden group">
              <PropertyImageCarousel
                property={property}
                onImageClick={onImageClick}
                height="h-48"
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {property.title}
                  </h4>
                  <button
                    onClick={() => handleSaveClick(property.id)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {isPropertySaved(property.id) ? (
                      <HeartSolidIcon className="w-5 h-5 text-blue-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                    )}
                  </button>
                </div>

                <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-3">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {property.location}
                </div>

                {property.description && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {property.description}
                  </p>
                )}

                {property.price && (
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    ${Number(property.price).toFixed(2)}/month
                  </p>
                )}

                {/* Amenities */}
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
                  {property.available_rooms && property.available_rooms > 0 && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {property.available_rooms} Available
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {profile?.role === 'tenant' && (
                    <button
                      onClick={() => handleApplyClick(property)}
                      disabled={hasAppliedToProperty(property.id)}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        hasAppliedToProperty(property.id)
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {hasAppliedToProperty(property.id) ? 'Applied' : 'Apply Now'}
                    </button>
                  )}

                  {profile?.role === 'agent' && property.created_by === profile.id && (
                    <button
                      onClick={() => router.push(`/dashboard/manage-properties/${property.id}`)}
                      className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // List View Card
            <div key={property.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden group">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-64 h-48 sm:h-32 flex-shrink-0">
                  <PropertyImageCarousel
                    property={property}
                    onImageClick={onImageClick}
                    height="h-full"
                  />
                </div>

                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {property.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      {property.price && (
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          ${Number(property.price).toFixed(2)}/month
                        </span>
                      )}
                      <button
                        onClick={() => handleSaveClick(property.id)}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {isPropertySaved(property.id) ? (
                          <HeartSolidIcon className="w-5 h-5 text-blue-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {property.location}
                  </div>

                  {property.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-1">
                      {property.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
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
                      {property.available_rooms && property.available_rooms > 0 && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {property.available_rooms} Available
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {profile?.role === 'tenant' && (
                        <button
                          onClick={() => handleApplyClick(property)}
                          disabled={hasAppliedToProperty(property.id)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            hasAppliedToProperty(property.id)
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {hasAppliedToProperty(property.id) ? 'Applied' : 'Apply Now'}
                        </button>
                      )}

                      {profile?.role === 'agent' && property.created_by === profile.id && (
                        <button
                          onClick={() => router.push(`/dashboard/manage-properties/${property.id}`)}
                          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <HomeIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No properties found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your search criteria or check back later for new listings.
          </p>
        </div>
      )}
    </div>
  )
}
