import clsx, { ClassValue } from 'clsx'

/**
 * Utility function to merge class names
 * This is a simple wrapper around clsx for consistency
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Re-export clsx for direct usage if needed
export { clsx }
export type { ClassValue }