'use client';

import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/utils/imageHelpers';

interface PropertyImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
}

export default function PropertyImage({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/file.svg',
  width,
  height 
}: PropertyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const imageUrl = getImageUrl(src);
    
    // Only set image source if we have a valid URL
    if (imageUrl && imageUrl !== '/file.svg') {
      setImageSrc(imageUrl);
      setIsLoading(true);
      setHasError(false);
    } else {
      // Use fallback immediately for empty or invalid sources
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(false);
    }
  }, [src, fallbackSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = (e: any) => {
    setIsLoading(false);
    setHasError(true);
    setImageSrc(fallbackSrc);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // Force reload by adding timestamp
    const imageUrl = getImageUrl(src);
    setImageSrc(`${imageUrl}?t=${Date.now()}`);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc || fallbackSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        width={width}
        height={height}
        style={{
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }}
      />
      
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-center mb-2">Failed to load image</p>
          <button
            onClick={handleRetry}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
