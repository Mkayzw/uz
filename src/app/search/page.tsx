import { Metadata } from 'next'
import { seoService } from '@/lib/seo/service'
import { Suspense } from 'react'
import SearchResults from './SearchResults'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; city?: string; minPrice?: string; maxPrice?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const query = params.q || ''
  const city = params.city || ''
  
  // Create a combined search query for SEO
  const searchQuery = [query, city].filter(Boolean).join(' ')
  
  // Generate SEO metadata using our service
  const seoMetadata = await seoService.generateMetadata('search', {
    query: searchQuery || 'student accommodation',
    results: 0 // We don't have the count yet, will be updated by client
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
    robots: {
      index: false, // Don't index search result pages
      follow: true,
    },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchResults searchParams={params} />
      </Suspense>
    </div>
  )
}

function SearchPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    </div>
  )
}