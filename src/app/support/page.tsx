import { Metadata } from 'next';
import { SEOService } from '@/lib/seo/service';
import { generateFAQSchema } from '@/lib/seo/structuredData';
import SupportPageClient from './SupportPageClient';

const faqs = [
  { question: 'What is Unistay?', answer: 'Unistay is a platform that helps students find accommodation near their universities. We verify all properties to ensure they meet our standards.' },
  { question: 'How do I apply for a property?', answer: 'You can apply for a property by clicking the "Apply Now" button on the property listing page. You will be asked to fill out a form and submit it for review.' },
  { question: 'Can I schedule a viewing?', answer: 'Yes, you can schedule a viewing by contacting the agent through the contact form on the property listing page.' },
];

export async function generateMetadata(): Promise<Metadata> {
  const seoService = new SEOService();
  const metadata = await seoService.generateStaticMetadata('Support', 'Get help and answers to your questions.', '/support');
  const faqSchema = generateFAQSchema(faqs);

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: metadata.openGraph,
    twitter: metadata.twitter,
    alternates: {
      canonical: metadata.canonical,
    },
    other: {
      'structured-data': JSON.stringify(faqSchema),
    },
  };
}

export default function SupportPage() {
  return <SupportPageClient />;
}