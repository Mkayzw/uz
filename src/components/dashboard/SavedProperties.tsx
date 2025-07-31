import { SavedProperty, Application, DashboardTab } from '@/types/dashboard'
import PropertyImage from '@/components/PropertyImage'

interface SavedPropertiesProps {
  savedProperties: SavedProperty[]
  applications: Application[]
  onApplyToProperty: (propertyId: string) => void
  onCancelApplication: (applicationId: string) => void
  onUnsaveProperty: (propertyId: string) => void
  onImageClick: (src: string | null, alt: string) => void
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
      <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No saved properties</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start browsing properties and save your favorites here.
        </p>
        <div className="mt-6">
          <button
            onClick={() => setActiveTab('browse')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Properties
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Saved Properties</h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedProperties.map((savedProperty) => (
          <div key={savedProperty.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <button
              onClick={() => onImageClick(
                savedProperty.property?.image_url || null, 
                savedProperty.property?.title || 'Property'
              )}
              className="w-full h-48 object-cover rounded-t-2xl"
            >
              <PropertyImage
                src={savedProperty.property?.image_url || null}
                alt={savedProperty.property?.title || 'Property'}
                className="w-full h-full object-cover rounded-t-2xl"
              />
            </button>
            <div className="p-6">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {savedProperty.property?.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                {savedProperty.property?.location}
              </p>
              {savedProperty.property?.price && (
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  ${Number(savedProperty.property.price).toFixed(2)}/month
                </p>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleApplyClick(savedProperty)}
                  disabled={false}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    hasAppliedToProperty(savedProperty.bed_id)
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {hasAppliedToProperty(savedProperty.bed_id) ? 'Cancel Application' : 'Apply'}
                </button>
                <button
                  onClick={() => onUnsaveProperty(savedProperty.bed_id)}
                  className="px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
