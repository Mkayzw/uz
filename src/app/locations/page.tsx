import { Metadata } from 'next'
import { seoService } from '@/lib/seo/service'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  const seoMetadata = await seoService.generateMetadata('static', {
    title: 'Student Accommodation Locations',
    description: 'Browse student accommodation by location. Find the perfect housing near your university in cities across Zimbabwe.',
    path: '/locations'
  })
  
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

const CITIES = [
  {
    slug: 'harare',
    name: 'Harare',
    description: 'The capital city with multiple universities and diverse accommodation options.',
    propertyCount: '150+',
    image: '/images/cities/harare.jpg'
  },
  {
    slug: 'bulawayo',
    name: 'Bulawayo',
    description: 'Zimbabwe\'s second-largest city with affordable student housing options.',
    propertyCount: '80+',
    image: '/images/cities/bulawayo.jpg'
  },
  {
    slug: 'gweru',
    name: 'Gweru',
    description: 'Home to Midlands State University with growing student accommodation.',
    propertyCount: '45+',
    image: '/images/cities/gweru.jpg'
  }
]

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Student Accommodation by Location
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Find the perfect student housing near your university. Browse verified properties 
              in cities across Zimbabwe with detailed area information and local insights.
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
                <span className="text-gray-900 dark:text-gray-100 font-medium">Locations</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/locations/${city.slug}`}
              className="group block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-blue-500 dark:hover:border-blue-400"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                <img
                  src={city.image}
                  alt={`Student accommodation in ${city.name}`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {city.name}
                  </h3>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    {city.propertyCount} properties
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {city.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                  View properties
                  <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Why Choose Location-Based Search?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                University Proximity
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Find accommodation within walking distance or easy commute to your university campus.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Local Pricing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Compare prices in different areas to find accommodation that fits your budget.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Area Amenities
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Discover local amenities like shops, restaurants, and transport links in each area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}