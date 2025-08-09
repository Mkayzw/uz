'use client'

import { useEffect, useRef } from 'react'

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  enabled?: boolean
}

export function useTouchGestures<T extends HTMLElement = HTMLElement>(
  elementRef: React.RefObject<T | null> | React.MutableRefObject<T | null>,
  options: TouchGestureOptions
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    enabled = true
  } = options

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const element = elementRef.current

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      if (
        touchStartX.current === null ||
        touchStartY.current === null ||
        touchEndX.current === null ||
        touchEndY.current === null
      ) {
        return
      }

      const deltaX = touchEndX.current - touchStartX.current
      const deltaY = touchEndY.current - touchStartY.current
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Determine if it's a horizontal or vertical swipe
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }

      // Reset values
      touchStartX.current = null
      touchStartY.current = null
      touchEndX.current = null
      touchEndY.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold])
}

// Hook for detecting swipe on the entire document
export function useDocumentSwipe(options: TouchGestureOptions) {
  const documentRef = useRef<HTMLElement>(
    typeof document !== 'undefined' ? document.documentElement : null
  )

  useEffect(() => {
    if (typeof document !== 'undefined') {
      documentRef.current = document.documentElement
    }
  }, [])

  useTouchGestures(documentRef, options)
}