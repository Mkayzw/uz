import { SEOMetadata, ValidationResult, OpenGraphData, TwitterCardData } from '@/types/seo';
import { seoConfig } from './config';

/**
 * SEO Utility Functions for Unistay Platform
 */

// Text processing utilities
export const seoUtils = {
  /**
   * Truncate text to specified length with ellipsis
   */
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3).trim() + '...';
  },

  /**
   * Clean and optimize text for SEO
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .trim();
  },

  /**
   * Generate SEO-friendly slug from text
   */
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  },

  /**
   * Extract keywords from text
   */
  extractKeywords(text: string, maxKeywords: number = 10): string[] {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  },

  /**
   * Validate meta title length and content
   */
  validateTitle(title: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!title) {
      errors.push('Title is required');
    } else {
      if (title.length > 60) {
        errors.push('Title should be 60 characters or less');
      } else if (title.length < 30) {
        warnings.push('Title should be at least 30 characters for better SEO');
      }

      if (!title.includes('Unistay')) {
        warnings.push('Consider including "Unistay" in the title for brand recognition');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Validate meta description length and content
   */
  validateDescription(description: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!description) {
      errors.push('Description is required');
    } else {
      if (description.length > 160) {
        errors.push('Description should be 160 characters or less');
      } else if (description.length < 120) {
        warnings.push('Description should be at least 120 characters for better SEO');
      }

      if (!description.toLowerCase().includes('student')) {
        warnings.push('Consider including "student" in the description for better targeting');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Generate Open Graph data from basic metadata
   */
  generateOpenGraphData(
    title: string,
    description: string,
    url: string,
    image: string,
    type: 'website' | 'article' | 'product' = 'website'
  ): OpenGraphData {
    return {
      title: this.truncateText(title, 60),
      description: this.truncateText(description, 160),
      url: seoConfig.generateCanonicalUrl(url),
      type,
      image: image.startsWith('http') ? image : `${seoConfig.getSiteUrl()}${image}`,
      imageAlt: `${title} - ${seoConfig.getSiteName()}`,
      siteName: seoConfig.getSiteName(),
      locale: 'en_US'
    };
  },

  /**
   * Generate Twitter Card data from basic metadata
   */
  generateTwitterCardData(
    title: string,
    description: string,
    image: string,
    card: 'summary' | 'summary_large_image' = 'summary_large_image'
  ): TwitterCardData {
    const socialMedia = seoConfig.getSocialMediaHandles();
    
    return {
      card,
      site: socialMedia.twitter,
      title: this.truncateText(title, 60),
      description: this.truncateText(description, 160),
      image: image.startsWith('http') ? image : `${seoConfig.getSiteUrl()}${image}`,
      imageAlt: `${title} - ${seoConfig.getSiteName()}`
    };
  },

  /**
   * Validate complete SEO metadata
   */
  validateMetadata(metadata: SEOMetadata): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate title
    const titleValidation = this.validateTitle(metadata.title);
    errors.push(...titleValidation.errors);
    warnings.push(...titleValidation.warnings);

    // Validate description
    const descriptionValidation = this.validateDescription(metadata.description);
    errors.push(...descriptionValidation.errors);
    warnings.push(...descriptionValidation.warnings);

    // Validate canonical URL
    if (metadata.canonical) {
      try {
        new URL(metadata.canonical);
      } catch {
        errors.push('Canonical URL must be a valid URL');
      }
    }

    // Validate Open Graph data
    if (!metadata.openGraph.image) {
      warnings.push('Open Graph image is recommended for better social sharing');
    }

    // Validate keywords
    if (metadata.keywords && metadata.keywords.length > 10) {
      warnings.push('Consider limiting keywords to 10 or fewer for better focus');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Merge metadata with defaults
   */
  mergeWithDefaults(metadata: Partial<SEOMetadata>): SEOMetadata {
    const config = seoConfig.getConfig();
    
    return {
      title: metadata.title || config.defaultTitle,
      description: metadata.description || config.defaultDescription,
      keywords: metadata.keywords || config.defaultKeywords,
      canonical: metadata.canonical,
      openGraph: metadata.openGraph || this.generateOpenGraphData(
        metadata.title || config.defaultTitle,
        metadata.description || config.defaultDescription,
        '/',
        '/images/og-default.jpg'
      ),
      twitter: metadata.twitter || this.generateTwitterCardData(
        metadata.title || config.defaultTitle,
        metadata.description || config.defaultDescription,
        '/images/og-default.jpg'
      ),
      structuredData: metadata.structuredData || []
    };
  }
};