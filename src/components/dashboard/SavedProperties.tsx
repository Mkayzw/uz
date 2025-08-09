import { SavedProperty, Application, DashboardTab } from '@/types/dashboard'
import PropertyImage from '@/components/PropertyImage'

interface SavedPropertiesProps {
  savedProperties: SavedProperty[]
  applications: Application[]
  onApplyToProperty: (propertyId: string) => void
  onCancelApplication: (applicationId: string) => void
  onUnsaveProperty: (propertyId: string) => void
  onImageClick: (src: string | null, alt: string, allImages?: string[], initialIndex?: number) => void
  setActiveTab: (tab: DashboardTab) => void
}

export default function SavedProperties({
  savedProperties,
  applications,
  onApplyToProperty,
  onCancelApplication,
  onUnsaveProperty,
  onImageClick,
  setActiveTab
}: SavedPropertiesProps) {
  const hasAppliedToProperty = (propertyId: string) => {
    return applications.some(app => app.bed_id === propertyId && app.status !== 'cancelled')
  }

  const handleApplyClick = (savedProperty: SavedProperty) => {
    if (hasAppliedToProperty(savedProperty.bed_id)) {
      const application = applications.find(app => app.bed_id === savedProperty.bed_id)
      if (application) {
        onCancelApplication(application.id)
      }
    } else {
      onApplyToProperty(savedProperty.bed_id)
    }
  }

  if (savedProperties.length === 0) {
    return (
      <div className="text-center bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-6 sm:p-8">
        <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No saved properties</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Start browsing properties and save your favorites here.
        </p>
        <div className="mt-4 sm:mt-6">
          <button
            onClick={() => setActiveTab('browse')}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 touch-manipulation min-h-[44px]"
          >
            Browse Properties
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 px-1">Saved Properties</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {savedProperties.map((savedProperty) => {
          const property = savedProperty.property
          if (!property) return null

          const allImages: string[] = []
          if (property.image_url) {
            allImages.push(property.image_url)
          }
          if (property.image_urls && property.image_urls.length > 0) {
            property.image_urls.forEach(url => {
              if (url && url !== property.image_url) {
                allImages.push(url)
              }
            })
          }

          return (
            <div key={savedProperty.id} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <button
                onClick={() => onImageClick(
                  allImages[0] || null,
                  property.title || 'Property',
                  allImages,
                  0
                )}
                className="w-full h-48 sm:h-56 relative touch-manipulation"
              >
                <PropertyImage
                  src={allImages[0] || null}
                  alt={property.title || 'Property'}
                  className="w-full h-full object-cover"
                />
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                    {allImages.length} photos
                  </div>
                )}
              </button>
              <div className="p-4 sm:p-6">
                <h4 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-2">
                  {property.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{property.location}</span>
                </p>
                {property.price && (
                  <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-3 sm:mb-4">
                    ${Number(property.price).toFixed(2)}/mo
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyClick(savedProperty)}
                    disabled={false}
                    className={`flex-1 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] ${
                      hasAppliedToProperty(savedProperty.bed_id)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {hasAppliedToProperty(savedProperty.bed_id) ? 'Cancel' : 'Apply'}
                  </button>
                  <button
                    onClick={() => onUnsaveProperty(savedProperty.bed_id)}
                    className="px-3 py-2.5 text-xs sm:text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px]"
                  >
                    <span className="sm:hidden">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </span>
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
