import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DisableConsole from "@/components/DisableConsole";
import { seoService } from "@/lib/seo/service";
import { Analytics } from '@vercel/analytics/next';

export async function generateMetadata(): Promise<Metadata> {
  const seoMetadata = await seoService.generateMetadata('home');
  
  return {
    title: seoMetadata.title,
    description: seoMetadata.description,
    keywords: seoMetadata.keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://unistay.online'),
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

import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <DisableConsole />
          {children}
          {/* Global Beta badge */}
          <div className="fixed top-3 right-3 z-50 select-none pointer-events-none" role="note" aria-label="This site is in beta">
            <span
              className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wide rounded-full shadow-md bg-blue-600 text-white dark:bg-blue-500"
              title="Beta"
            >
              Beta
            </span>
          </div>
        </ThemeProvider>
        <GoogleAnalytics gaId="YOUR_GOOGLE_ANALYTICS_ID" />
        <GoogleTagManager gtmId="GTM-T3R7C697" />
        <Analytics />
      </body>
    </html>
  );
}
