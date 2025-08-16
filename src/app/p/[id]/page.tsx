import { SEOService } from '@/lib/seo/service';
import { Property } from '@/types/seo';
import { Metadata } from 'next';

type Props = {
  params: { id: string };
};

// Mock data fetching function
async function getProperty(id: string): Promise<Property> {
  // In a real application, you would fetch this data from a database or API
  return {
    id,
    title: `Modern Apartment in Downtown`,
    description: 'A beautiful and modern apartment located in the heart of the city. Perfect for students and young professionals.',
    location: {
      city: 'Harare',
      area: 'CBD',
      coordinates: [-17.8252, 31.0335],
    },
    features: ['WiFi', 'Furnished', 'Parking'],
    price: 1200,
    images: ['/images/property1.jpg', '/images/property2.jpg'],
    lastModified: new Date(),
    slug: `modern-apartment-in-downtown-${id}`,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getProperty(params.id);
  const seoService = new SEOService();
  const metadata = await seoService.generatePropertyMetadata(property);

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

import Image from 'next/image';

export default async function PropertyPage({ params }: Props) {
  const property = await getProperty(params.id);

  return (
    <div>
      <h1>{property.title}</h1>
      <p>{property.description}</p>
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <Image 
          src={property.images[0]} 
          alt={property.title} 
          layout='fill'
          objectFit='cover'
        />
      </div>
    </div>
  );
}