import { SEOService } from '@/lib/seo/service';
import { Location } from '@/types/seo';
import { Metadata } from 'next';

type Props = {
  params: { city: string; area: string };
};

// Mock data fetching function
async function getLocation(city: string, area: string): Promise<Location> {
  // In a real application, you would fetch this data from a database or API
  return {
    city,
    area,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const location = await getLocation(params.city, params.area);
  const seoService = new SEOService();
  const metadata = await seoService.generateLocationMetadata(location);

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: metadata.openGraph,
    twitter: metadata.twitter,
    alternates: {
      canonical: metadata.canonical,
    },
  };
}

export default async function LocationPage({ params }: Props) {
  const location = await getLocation(params.city, params.area);

  return (
    <div>
      <h1>Student Accommodation in {location.area}, {location.city}</h1>
    </div>
  );
}
