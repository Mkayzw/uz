import { createClient } from '@/lib/supabase/client';

/**
 * Get the public URL for an image from Supabase Storage
 * @param imagePath - The path to the image in storage
 * @returns The public URL for the image
 */
export function getImageUrl(imagePath: string | null): string {
  if (!imagePath || imagePath.trim() === '') {
    return '/file.svg'; // Default fallback image
  }

  const supabase = createClient();
  
  try {
    // If the path already contains the full URL, return it as-is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's just a path, generate the public URL
    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(imagePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return '/file.svg'; // Fallback to default image
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

  return imagePaths.map(path => getImageUrl(path));
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
