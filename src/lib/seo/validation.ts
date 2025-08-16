import { SEOMetadata, ValidationResult, SEOError, SEOErrorType } from '@/types/seo'

/**
 * Comprehensive SEO Metadata Validation Utilities
 * Validates metadata against SEO best practices and requirements
 */

export interface MetadataValidationOptions {
  strict?: boolean // Enable strict validation with more stringent rules
  checkImages?: boolean // Validate image URLs and accessibility
  checkStructuredData?: boolean // Validate JSON-LD structured data
}

export interface DetailedValidationResult extends ValidationResult {
  score: number // SEO score out of 100
  suggestions: string[] // Actionable improvement suggestions
  criticalIssues: string[] // Issues that must be fixed
}

/**
 * Main metadata validation function
 */
export function validateSEOMetadata(
  metadata: SEOMetadata, 
  options: MetadataValidationOptions = {}
): DetailedValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  const criticalIssues: string[] = []
  let score = 100

  // Title validation
  const titleValidation = validateTitle(metadata.title, options.strict)
  errors.push(...titleValidation.errors)
  warnings.push(...titleValidation.warnings)
  if (titleValidation.errors.length > 0) {
    score -= 20
    criticalIssues.push('Title issues must be resolved')
  }
  if (titleValidation.warnings.length > 0) {
    score -= 5
  }

  // Description validation
  const descriptionValidation = validateDescription(metadata.description, options.strict)
  errors.push(...descriptionValidation.errors)
  warnings.push(...descriptionValidation.warnings)
  if (descriptionValidation.errors.length > 0) {
    score -= 15
    criticalIssues.push('Description issues must be resolved')
  }
  if (descriptionValidation.warnings.length > 0) {
    score -= 5
  }

  // Keywords validation
  if (metadata.keywords) {
    const keywordValidation = validateKeywords(metadata.keywords)
    warnings.push(...keywordValidation.warnings)
    if (keywordValidation.warnings.length > 0) {
      score -= 3
    }
  }

  // Canonical URL validation
  if (metadata.canonical) {
    const canonicalValidation = validateCanonicalUrl(metadata.canonical)
    errors.push(...canonicalValidation.errors)
    warnings.push(...canonicalValidation.warnings)
    if (canonicalValidation.errors.length > 0) {
      score -= 10
    }
  }

  // Open Graph validation
  const ogValidation = validateOpenGraph(metadata.openGraph, options.checkImages)
  errors.push(...ogValidation.errors)
  warnings.push(...ogValidation.warnings)
  if (ogValidation.errors.length > 0) {
    score -= 10
  }
  if (ogValidation.warnings.length > 0) {
    score -= 3
  }

  // Twitter Card validation
  const twitterValidation = validateTwitterCard(metadata.twitter, options.checkImages)
  errors.push(...twitterValidation.errors)
  warnings.push(...twitterValidation.warnings)
  if (twitterValidation.errors.length > 0) {
    score -= 8
  }
  if (twitterValidation.warnings.length > 0) {
    score -= 2
  }

  // Structured Data validation
  if (options.checkStructuredData && metadata.structuredData) {
    const structuredDataValidation = validateStructuredData(metadata.structuredData)
    errors.push(...structuredDataValidation.errors)
    warnings.push(...structuredDataValidation.warnings)
    if (structuredDataValidation.errors.length > 0) {
      score -= 12
    }
  }

  // Generate suggestions
  suggestions.push(...generateSuggestions(metadata, { errors, warnings }))

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
    suggestions,
    criticalIssues
  }
}

/**
 * Validate title according to SEO best practices
 */
export function validateTitle(title: string, strict = false): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!title || title.trim().length === 0) {
    errors.push('Title is required')
    return { isValid: false, errors, warnings }
  }

  const trimmedTitle = title.trim()

  // Length validation
  if (trimmedTitle.length > 60) {
    errors.push(`Title is ${trimmedTitle.length} characters, should be 60 or less`)
  } else if (trimmedTitle.length < 30) {
    warnings.push(`Title is ${trimmedTitle.length} characters, consider 30-60 for better SEO`)
  }

  // Content validation
  if (strict) {
    if (!trimmedTitle.toLowerCase().includes('unistay')) {
      warnings.push('Consider including "Unistay" for brand recognition')
    }

    if (!trimmedTitle.toLowerCase().includes('student')) {
      warnings.push('Consider including "student" for better targeting')
    }

    // Check for duplicate words
    const words = trimmedTitle.toLowerCase().split(/\s+/)
    const duplicates = words.filter((word, index) => words.indexOf(word) !== index)
    if (duplicates.length > 0) {
      warnings.push('Title contains duplicate words, consider rephrasing')
    }

    // Check for excessive capitalization
    const upperCaseCount = (trimmedTitle.match(/[A-Z]/g) || []).length
    if (upperCaseCount > trimmedTitle.length * 0.3) {
      warnings.push('Title has excessive capitalization')
    }
  }

  // Special characters validation
  if (trimmedTitle.includes('|') && trimmedTitle.split('|').length > 2) {
    warnings.push('Multiple separators (|) in title may reduce readability')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate description according to SEO best practices
 */
export function validateDescription(description: string, strict = false): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!description || description.trim().length === 0) {
    errors.push('Description is required')
    return { isValid: false, errors, warnings }
  }

  const trimmedDescription = description.trim()

  // Length validation
  if (trimmedDescription.length > 160) {
    errors.push(`Description is ${trimmedDescription.length} characters, should be 160 or less`)
  } else if (trimmedDescription.length < 120) {
    warnings.push(`Description is ${trimmedDescription.length} characters, consider 120-160 for better SEO`)
  }

  if (strict) {
    // Content validation
    if (!trimmedDescription.toLowerCase().includes('student')) {
      warnings.push('Consider including "student" in description for better targeting')
    }

    if (!trimmedDescription.toLowerCase().includes('accommodation')) {
      warnings.push('Consider including "accommodation" in description')
    }

    // Check for call-to-action
    const hasCallToAction = /\b(find|discover|browse|search|book|contact|view)\b/i.test(trimmedDescription)
    if (!hasCallToAction) {
      warnings.push('Consider adding a call-to-action word (find, discover, browse, etc.)')
    }

    // Check for location mention
    const hasLocation = /\b(harare|bulawayo|gweru|zimbabwe|city|area|near|in)\b/i.test(trimmedDescription)
    if (!hasLocation) {
      warnings.push('Consider mentioning location for better local SEO')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate keywords array
 */
export function validateKeywords(keywords: string[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (keywords.length === 0) {
    warnings.push('No keywords provided, consider adding relevant keywords')
    return { isValid: true, errors, warnings }
  }

  if (keywords.length > 10) {
    warnings.push(`${keywords.length} keywords provided, consider limiting to 10 or fewer`)
  }

  // Check for duplicate keywords
  const duplicates = keywords.filter((keyword, index) => keywords.indexOf(keyword) !== index)
  if (duplicates.length > 0) {
    warnings.push('Duplicate keywords found, consider removing duplicates')
  }

  // Check keyword length
  const longKeywords = keywords.filter(keyword => keyword.length > 50)
  if (longKeywords.length > 0) {
    warnings.push('Some keywords are very long, consider shorter phrases')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate canonical URL
 */
export function validateCanonicalUrl(canonicalUrl: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!canonicalUrl) {
    warnings.push('Canonical URL not provided')
    return { isValid: true, errors, warnings }
  }

  try {
    const url = new URL(canonicalUrl)
    
    // Check protocol
    if (url.protocol !== 'https:') {
      warnings.push('Canonical URL should use HTTPS')
    }

    // Check for query parameters
    if (url.search) {
      warnings.push('Canonical URL contains query parameters, consider removing them')
    }

    // Check for fragment
    if (url.hash) {
      warnings.push('Canonical URL contains fragment (#), consider removing it')
    }

  } catch (error) {
    errors.push('Canonical URL is not a valid URL')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate Open Graph data
 */
export function validateOpenGraph(openGraph: any, checkImages = false): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!openGraph) {
    errors.push('Open Graph data is required')
    return { isValid: false, errors, warnings }
  }

  // Required fields
  if (!openGraph.title) {
    errors.push('Open Graph title is required')
  }
  if (!openGraph.description) {
    errors.push('Open Graph description is required')
  }
  if (!openGraph.url) {
    errors.push('Open Graph URL is required')
  }
  if (!openGraph.image) {
    errors.push('Open Graph image is required')
  }

  // Validate image URL if checking images
  if (checkImages && openGraph.image) {
    try {
      new URL(openGraph.image)
    } catch {
      errors.push('Open Graph image URL is not valid')
    }
  }

  // Validate type
  const validTypes = ['website', 'article', 'product', 'profile']
  if (openGraph.type && !validTypes.includes(openGraph.type)) {
    warnings.push(`Open Graph type "${openGraph.type}" is not commonly supported`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate Twitter Card data
 */
export function validateTwitterCard(twitter: any, checkImages = false): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!twitter) {
    warnings.push('Twitter Card data not provided')
    return { isValid: true, errors, warnings }
  }

  // Validate card type
  const validCards = ['summary', 'summary_large_image', 'app', 'player']
  if (!twitter.card || !validCards.includes(twitter.card)) {
    errors.push('Twitter Card type must be one of: summary, summary_large_image, app, player')
  }

  // Required fields for most card types
  if (!twitter.title) {
    errors.push('Twitter Card title is required')
  }
  if (!twitter.description) {
    errors.push('Twitter Card description is required')
  }

  // Validate image URL if checking images
  if (checkImages && twitter.image) {
    try {
      new URL(twitter.image)
    } catch {
      errors.push('Twitter Card image URL is not valid')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate structured data (JSON-LD)
 */
export function validateStructuredData(structuredData: any[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!Array.isArray(structuredData)) {
    errors.push('Structured data must be an array')
    return { isValid: false, errors, warnings }
  }

  structuredData.forEach((data, index) => {
    if (!data['@context']) {
      errors.push(`Structured data item ${index + 1} missing @context`)
    }
    if (!data['@type']) {
      errors.push(`Structured data item ${index + 1} missing @type`)
    }

    // Validate common schema types
    if (data['@type'] === 'Organization') {
      if (!data.name) {
        errors.push(`Organization schema missing required 'name' property`)
      }
      if (!data.url) {
        errors.push(`Organization schema missing required 'url' property`)
      }
    }

    if (data['@type'] === 'RealEstateListing') {
      if (!data.name) {
        errors.push(`RealEstateListing schema missing required 'name' property`)
      }
      if (!data.address) {
        errors.push(`RealEstateListing schema missing required 'address' property`)
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generate actionable suggestions for improvement
 */
function generateSuggestions(metadata: SEOMetadata, validation: { errors: string[], warnings: string[] }): string[] {
  const suggestions: string[] = []

  // Title suggestions
  if (metadata.title.length < 30) {
    suggestions.push('Expand your title to 30-60 characters for better search visibility')
  }
  if (metadata.title.length > 50) {
    suggestions.push('Consider shortening your title to prevent truncation in search results')
  }

  // Description suggestions
  if (metadata.description.length < 120) {
    suggestions.push('Expand your description to 120-160 characters to maximize search snippet space')
  }

  // Keywords suggestions
  if (!metadata.keywords || metadata.keywords.length < 3) {
    suggestions.push('Add 3-5 relevant keywords to improve content targeting')
  }

  // Image suggestions
  if (!metadata.openGraph.image.includes('og-')) {
    suggestions.push('Consider using dedicated Open Graph images (1200x630px) for better social sharing')
  }

  // Structured data suggestions
  if (!metadata.structuredData || metadata.structuredData.length === 0) {
    suggestions.push('Add structured data (JSON-LD) to help search engines understand your content better')
  }

  return suggestions
}

/**
 * Create SEO error from validation result
 */
export function createSEOError(
  validationResult: DetailedValidationResult,
  context: any = {}
): SEOError | null {
  if (validationResult.isValid) {
    return null
  }

  const severity = validationResult.criticalIssues.length > 0 ? 'critical' : 
                  validationResult.errors.length > 0 ? 'high' : 'medium'

  return {
    type: SEOErrorType.METADATA_VALIDATION_ERROR,
    message: `SEO metadata validation failed with ${validationResult.errors.length} errors and ${validationResult.warnings.length} warnings`,
    context: {
      ...context,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      score: validationResult.score,
      suggestions: validationResult.suggestions
    },
    severity
  }
}

/**
 * Batch validate multiple metadata objects
 */
export function batchValidateMetadata(
  metadataList: { id: string; metadata: SEOMetadata }[],
  options: MetadataValidationOptions = {}
): { id: string; result: DetailedValidationResult }[] {
  return metadataList.map(({ id, metadata }) => ({
    id,
    result: validateSEOMetadata(metadata, options)
  }))
}