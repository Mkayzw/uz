import { seoService } from '@/lib/seo/service';
import { Location } from '@/types/seo';
import { Metadata } from 'next';

type Props = {
  // Make params async to align with project-wide usage of Promise-based params
  params: Promise<{ city: string; area: string }>;
};

// Mock data fetching function
async function getLocation(city: string, area: string): Promise<Location> {
  // In a real application, you would fetch this data from a database or API
  return {
    city,
    area,
    country: 'Zimbabwe',
    coordinates: [0, 0],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, area } = await params;
  const location = await getLocation(city, area);
  const seoMetadata = await seoService.generateLocationMetadata(location);

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
  };
}

export default async function LocationPage({ params }: Props) {
  const { city, area } = await params;
  const location = await getLocation(city, area);

  return (
    <div>
      <h1>Student Accommodation in {location.area}, {location.city}</h1>
    </div>
  );
}
