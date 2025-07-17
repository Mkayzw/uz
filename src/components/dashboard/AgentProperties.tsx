import { useRouter } from 'next/navigation'
import { Property } from '@/types/dashboard'
import PropertyImage from '@/components/PropertyImage'

interface AgentPropertiesProps {
  properties: Property[]
  onImageClick: (src: string | null, alt: string) => void
}

export default function AgentProperties({ properties, onImageClick }: AgentPropertiesProps) {
  const router = useRouter()

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col">
              <button
                onClick={() => onImageClick(property.image_url, property.title)}
                className="w-full h-40 object-cover rounded-t-2xl"
              >
                <PropertyImage
                  src={property.image_url}
                  alt={property.title}
                  className="w-full h-full object-cover rounded-t-2xl"
                />
              </button>
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex-grow">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">{property.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{property.location}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {property.view_count || 0} {property.view_count === 1 ? 'view' : 'views'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/edit-property/${property.id}`)}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Unpublish
                    </button>
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
