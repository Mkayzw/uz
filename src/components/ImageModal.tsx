
'use client'

import { useEffect, useState } from 'react'
import PropertyImage from '@/components/PropertyImage'
import { getImageUrl } from '@/lib/utils/imageHelpers'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt: string
  allImages?: string[]
  initialIndex?: number
}

export default function ImageModal({ isOpen, onClose, src, alt, allImages, initialIndex = 0 }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [touchStartX, setTouchStartX] = useState(0)

  // Use allImages if provided, otherwise fallback to single src
  const images = allImages && allImages.length > 0 ? allImages : [src]
  const currentSrc = images[currentIndex] || src

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const distance = touchStartX - touchEndX
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        nextImage() // Swipe left - next image
      } else {
        prevImage() // Swipe right - previous image
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 transition-opacity touch-manipulation"
      onClick={onClose}
      style={{ WebkitTouchCallout: 'none' }}
    >
      {/* Close button - mobile-first positioning */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-3xl sm:text-4xl hover:text-gray-300 transition-colors z-10 touch-manipulation bg-black bg-opacity-50 rounded-full w-12 h-12 sm:w-auto sm:h-auto sm:bg-transparent flex items-center justify-center"
        style={{ WebkitTouchCallout: 'none' }}
      >
        &times;
      </button>

      {/* Main image container - mobile-optimized */}
      <div
        className="relative w-full h-full sm:max-w-4xl sm:max-h-[90vh] sm:w-auto sm:h-auto p-2 sm:p-4 flex items-center justify-center touch-manipulation"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ WebkitTouchCallout: 'none', touchAction: 'pan-y pinch-zoom' }}
      >
        <PropertyImage
          src={getImageUrl(currentSrc)}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          fallbackSrc="/file.svg"
        />

        {/* Mobile-first navigation for multiple images */}
        {images.length > 1 && (
          <>
            {/* Navigation buttons - larger touch targets for mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-3 sm:p-3 rounded-full hover:bg-opacity-80 transition-all touch-manipulation"
              style={{ WebkitTouchCallout: 'none', minWidth: '48px', minHeight: '48px' }}
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-3 sm:p-3 rounded-full hover:bg-opacity-80 transition-all touch-manipulation"
              style={{ WebkitTouchCallout: 'none', minWidth: '48px', minHeight: '48px' }}
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image counter - mobile-optimized positioning */}
            <div className="absolute bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-2 sm:px-3 sm:py-1 rounded-full text-sm sm:text-xs">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Image indicators - larger touch targets for mobile */}
            <div className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 flex space-x-3 sm:space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  className={`w-4 h-4 sm:w-3 sm:h-3 rounded-full transition-all touch-manipulation ${
                    index === currentIndex
                      ? 'bg-white shadow-lg'
                      : 'bg-white bg-opacity-60'
                  }`}
                  style={{ WebkitTouchCallout: 'none', minWidth: '16px', minHeight: '16px' }}
                />
              ))}
            </div>

            {/* Mobile swipe hint */}
            <div className="sm:hidden absolute top-6 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded-full animate-pulse">
              Swipe to navigate
            </div>
          </>
        )}
      </div>
    </div>
  )
}
