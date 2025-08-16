import { SEOConfig } from '@/types/seo';

// Default SEO Configuration for Unistay Platform
export const defaultSEOConfig: SEOConfig = {
  siteName: 'Unistay',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://unistay.online',
  defaultTitle: 'Unistay - Premium Student Accommodation & Housing',
  defaultDescription: 'Find the perfect student accommodation with Unistay. Browse verified properties, connect with landlords, and secure your ideal housing near universities worldwide.',
  defaultKeywords: [
    'student accommodation',
    'student housing',
    'university housing',
    'student apartments',
    'student rentals',
    'accommodation near university',
    'student living',
    'furnished student rooms'
  ],
  socialMedia: {
    twitter: '@unistay',
    facebook: 'unistay',
    instagram: 'unistay'
  },
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || '',
    googleSearchConsoleId: process.env.NEXT_PUBLIC_GSC_ID || ''
  }
};

// SEO Configuration Utility Functions
export class SEOConfigManager {
  private config: SEOConfig;

  constructor(customConfig?: Partial<SEOConfig>) {
    this.config = {
      ...defaultSEOConfig,
      ...customConfig
    };
  }

  getConfig(): SEOConfig {
    return this.config;
  }

  updateConfig(updates: Partial<SEOConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
  }

  getSiteName(): string {
    return this.config.siteName;
  }

  getSiteUrl(): string {
    return this.config.siteUrl;
  }

  getDefaultTitle(): string {
    return this.config.defaultTitle;
  }

  getDefaultDescription(): string {
    return this.config.defaultDescription;
  }

  getDefaultKeywords(): string[] {
    return this.config.defaultKeywords;
  }

  getSocialMediaHandles() {
    return this.config.socialMedia;
  }

  getAnalyticsConfig() {
    return this.config.analytics;
  }

  // Generate canonical URL
  generateCanonicalUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.siteUrl}${cleanPath}`;
  }

  // Validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.siteName) {
      errors.push('Site name is required');
    }

    if (!this.config.siteUrl) {
      errors.push('Site URL is required');
    }

    if (!this.config.defaultTitle) {
      errors.push('Default title is required');
    }

    if (!this.config.defaultDescription) {
      errors.push('Default description is required');
    }

    if (this.config.defaultTitle.length > 60) {
      errors.push('Default title should be 60 characters or less');
    }

    if (this.config.defaultDescription.length > 160) {
      errors.push('Default description should be 160 characters or less');
    }

    try {
      new URL(this.config.siteUrl);
    } catch {
      errors.push('Site URL must be a valid URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Global SEO config instance
export const seoConfig = new SEOConfigManager();