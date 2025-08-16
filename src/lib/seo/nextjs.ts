import { Metadata } from 'next'
import React from 'react'
import { SEOMetadata } from '@/types/seo'

/**
 * Convert SEO metadata to Next.js Metadata format
 * This utility helps transform our internal SEO metadata structure
 * to the format expected by Next.js generateMetadata functions
 */
export function convertToNextjsMetadata(seoMetadata: SEOMetadata, baseUrl?: string): Metadata {
  const metadataBase = baseUrl ? new URL(baseUrl) : undefined

  return {
    title: seoMetadata.title,
    description: seoMetadata.description,
    keywords: seoMetadata.keywords,
    metadataBase,
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
          alt: seoMetadata.openGraph.imageAlt || seoMetadata.openGraph.title,
        },
      ],
      locale: seoMetadata.openGraph.locale || 'en_US',
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
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }
}

/**
 * Generate structured data script tag content
 * Returns the JSON-LD structured data as a string for script tags
 */
export function generateStructuredDataScript(seoMetadata: SEOMetadata): string | null {
  if (!seoMetadata.structuredData || seoMetadata.structuredData.length === 0) {
    return null
  }

  // If there's only one structured data item, return it directly
  if (seoMetadata.structuredData.length === 1) {
    return JSON.stringify(seoMetadata.structuredData[0], null, 2)
  }

  // If there are multiple items, wrap them in an array
  return JSON.stringify(seoMetadata.structuredData, null, 2)
}

/**
 * Create a React component for structured data
 * This can be used in layout or page components to inject structured data
 */
export function StructuredData({ seoMetadata }: { seoMetadata: SEOMetadata }) {
  const structuredDataScript = generateStructuredDataScript(seoMetadata)
  
  if (!structuredDataScript) {
    return null
  }

  return React.createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: structuredDataScript }
  })
}

/**
 * Generate metadata for error pages (404, 500, etc.)
 */
export function generateErrorPageMetadata(
  errorCode: number,
  errorMessage?: string,
  baseUrl?: string
): Metadata {
  const titles: Record<number, string> = {
    404: 'Page Not Found',
    500: 'Server Error',
    403: 'Access Forbidden',
    401: 'Unauthorized',
  }

  const descriptions: Record<number, string> = {
    404: 'The page you are looking for could not be found. Browse our available student accommodation or return to the homepage.',
    500: 'We are experiencing technical difficulties. Please try again later or contact support if the problem persists.',
    403: 'You do not have permission to access this page. Please log in or contact support for assistance.',
    401: 'You need to be logged in to access this page. Please sign in to continue.',
  }

  const title = `${titles[errorCode] || 'Error'} | Unistay`
  const description = descriptions[errorCode] || errorMessage || 'An error occurred while processing your request.'

  return {
    title,
    description,
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    robots: {
      index: false, // Don't index error pages
      follow: false,
    },
    openGraph: {
      title,
      description,
      siteName: 'Unistay',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

/**
 * Generate metadata for dynamic routes with fallback
 * Useful for catch-all routes or when data might not be available
 */
export function generateFallbackMetadata(
  pageType: string,
  baseUrl?: string
): Metadata {
  const fallbackTitles: Record<string, string> = {
    property: 'Student Accommodation | Unistay',
    location: 'Student Housing Locations | Unistay',
    search: 'Search Results | Unistay',
    profile: 'User Profile | Unistay',
  }

  const fallbackDescriptions: Record<string, string> = {
    property: 'Find quality student accommodation with Unistay. Browse verified properties and connect with landlords.',
    location: 'Discover student housing options in your preferred location. Browse by city and area to find the perfect accommodation.',
    search: 'Search results for student accommodation. Find properties that match your criteria on Unistay.',
    profile: 'Manage your Unistay profile, view your properties, and connect with students or landlords.',
  }

  return {
    title: fallbackTitles[pageType] || 'Unistay - Student Housing',
    description: fallbackDescriptions[pageType] || 'The premier platform for students to find safe, affordable, and convenient off-campus housing.',
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    openGraph: {
      title: fallbackTitles[pageType] || 'Unistay - Student Housing',
      description: fallbackDescriptions[pageType] || 'The premier platform for students to find safe, affordable, and convenient off-campus housing.',
      siteName: 'Unistay',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: fallbackTitles[pageType] || 'Unistay - Student Housing',
      description: fallbackDescriptions[pageType] || 'The premier platform for students to find safe, affordable, and convenient off-campus housing.',
    },
  }
}