import { createClient } from '@/lib/supabase/client';

// Create a single Supabase client instance to reuse
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

// Cache for image URLs to avoid repeated processing
const imageUrlCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500; // Limit cache size to prevent memory issues

/**
 * Get the public URL for an image from Supabase Storage
 * @param imagePath - The path to the image in storage
 * @returns The public URL for the image
 */
export function getImageUrl(imagePath: string | null): string {
  if (!imagePath || imagePath.trim() === '') {
    return '/file.svg'; // Default fallback image
  }

  // Check cache first
  if (imageUrlCache.has(imagePath)) {
    return imageUrlCache.get(imagePath)!;
  }

  // Clear cache if it gets too large
  if (imageUrlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageUrlCache.keys().next().value;
    if (firstKey) {
      imageUrlCache.delete(firstKey);
    }
  }

  try {
    // If the path already contains the full URL, return it as-is
    if (imagePath.startsWith('http')) {
      imageUrlCache.set(imagePath, imagePath);
      return imagePath;
    }

    // If it's just a path, generate the public URL
    const supabase = getSupabaseClient();
    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(imagePath);

    // Cache the result
    imageUrlCache.set(imagePath, data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    const fallbackUrl = '/file.svg';
    imageUrlCache.set(imagePath, fallbackUrl);
    return fallbackUrl; // Fallback to default image
  }
}

/**
 * Get the public URLs for multiple images from Supabase Storage
 * @param imagePaths - Array of image paths
 * @returns Array of public URLs
 */
export function getImageUrls(imagePaths: string[] | null): string[] {
  if (!imagePaths || imagePaths.length === 0) {
    return ['/file.svg'];
  }

  // Filter out empty/null paths and process in batches to avoid memory issues
  const validPaths = imagePaths.filter(path => path && path.trim() !== '');
  if (validPaths.length === 0) {
    return ['/file.svg'];
  }

  return validPaths.map(path => getImageUrl(path));
}

/**
 * Check if an image URL is valid by attempting to load it
 * @param url - The image URL to check
 * @returns Promise that resolves to true if image loads successfully
 */
export function checkImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Clear the image URL cache to free up memory
 */
export function clearImageCache(): void {
  imageUrlCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: imageUrlCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}
