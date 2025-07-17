import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Property, Application, SavedProperty, UserProfile } from '@/types/dashboard'
import PropertyImage from '@/components/PropertyImage'

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
    return savedProperties.some(sp => sp.property_id === propertyId)
  }

  const hasAppliedToProperty = (propertyId: string) => {
    return applications.some(app => app.property_id === propertyId && app.status !== 'cancelled')
  }

  const handleApplyClick = (property: Property) => {
    if (hasAppliedToProperty(property.id)) {
      const application = applications.find(app => app.property_id === property.id)
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <button
              onClick={() => onImageClick(property.image_url, property.title)}
              className="w-full h-48 object-cover rounded-t-2xl"
            >
              <PropertyImage
                src={property.image_url}
                alt={property.title}
                className="w-full h-full object-cover rounded-t-2xl"
              />
            </button>
            <div className="p-6">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{property.title}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{property.location}</p>
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
                {property.has_internet && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                    WiFi
                  </span>
                )}
                {property.has_parking && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Parking
                  </span>
                )}
                {property.is_furnished && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
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
                {profile?.role !== 'tenant' && (
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
