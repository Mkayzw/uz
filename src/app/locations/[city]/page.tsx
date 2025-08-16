import { Metadata } from 'next'
import { seoService } from '@/lib/seo/service'
import { Location } from '@/types/seo'
import { notFound } from 'next/navigation'
import PropertyListing from '@/components/PropertyListing'
import Link from 'next/link'

// Define supported cities and areas
const SUPPORTED_LOCATIONS: Record<string, { city: string; areas: string[]; country: string }> = {
  'harare': {
    city: 'Harare',
    areas: ['Avondale', 'Mount Pleasant', 'Newlands', 'Borrowdale', 'Eastlea'],
    country: 'Zimbabwe'
  },
  'bulawayo': {
    city: 'Bulawayo',
    areas: ['Hillside', 'Suburbs', 'Kumalo', 'North End'],
    country: 'Zimbabwe'
  },
  'gweru': {
    city: 'Gweru',
    areas: ['City Center', 'Ascot', 'Riverside'],
    country: 'Zimbabwe'
  }
}

interface CityPageProps {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params
  const citySlug = city.toLowerCase()
  const locationData = SUPPORTED_LOCATIONS[citySlug]
  
  if (!locationData) {
    return { title: 'Location Not Found | Unistay' }
  }

  // Create location object for SEO service
  const location: Location = {
    city: locationData.city,
    area: locationData.city, // Use city as area for city-level pages
    country: locationData.country,
    coordinates: [0, 0] // Default coordinates
  }

  // Generate SEO metadata using our service
  const seoMetadata = await seoService.generateMetadata('location', location)
  
  return {
    title: seoMetadata.title,
    description: seoMetadata.description,
    keywords: seoMetadata.keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://unistay.com'),
    alternates: {
      canonical: seoMetadata.canonical,
    },
    openGraph: {
      title: seoMetadata.openGraph.title,
      description: seoMetadata.openGraph.description,
      url: seoMetadata.openGraph.url,
      siteName: seoMetadata.openGraph.siteName,
      images: [
        {
          url: seoMetadata.openGraph.image,
          alt: seoMetadata.openGraph.imageAlt,
        },
      ],
      locale: seoMetadata.openGraph.locale,
      type: seoMetadata.openGraph.type as 'website' | 'article',
    },
    twitter: {
      card: seoMetadata.twitter.card,
      site: seoMetadata.twitter.site,
      creator: seoMetadata.twitter.creator,
      title: seoMetadata.twitter.title,
      description: seoMetadata.twitter.description,
      images: [seoMetadata.twitter.image],
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(SUPPORTED_LOCATIONS).map((city) => ({
    city,
  }))
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: cityParam } = await params
  const citySlug = cityParam.toLowerCase()
  const locationData = SUPPORTED_LOCATIONS[citySlug]
  
  if (!locationData) {
    notFound()
  }

  const { city, areas } = locationData

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Student Accommodation in {city}
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Find the perfect student housing in {city}. Browse verified properties, 
              connect with landlords, and secure your ideal accommodation near universities.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
                <Link href="/locations" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Locations
                </Link>
              </li>
              <li>
                <span className="text-gray-400 dark:text-gray-500">/</span>
              </li>
              <li>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{city}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Areas Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Popular Areas in {city}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Link
                key={area}
                href={`/locations/${citySlug}/${area.toLowerCase().replace(/\s+/g, '-')}`}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {area}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Student accommodation in {area}, {city}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Properties Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Available Properties in {city}
          </h2>
          <PropertyListing limit={12} showViewAll={true} />
        </div>
      </div>
    </div>
  )
}