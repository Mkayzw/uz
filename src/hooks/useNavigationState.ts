import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavigationState {
  isBackNavigation: boolean
  previousPath: string | null
  currentPath: string
}

export function useNavigationState() {
  const router = useRouter()
  const pathname = usePathname()
  const navigationState = useRef<NavigationState>({
    isBackNavigation: false,
    previousPath: null,
    currentPath: pathname
  })
  const historyStack = useRef<string[]>([])

  useEffect(() => {
    // Initialize history stack
    if (historyStack.current.length === 0) {
      historyStack.current.push(pathname)
    }

    // Detect navigation type
    const handlePopState = () => {
      navigationState.current.isBackNavigation = true
      
      // Remove current path from history stack if going back
      if (historyStack.current.length > 1) {
        historyStack.current.pop()
        navigationState.current.previousPath = historyStack.current[historyStack.current.length - 1]
      }
    }

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handlePopState)

    // Track forward navigation
    if (!navigationState.current.isBackNavigation) {
      // This is a forward navigation
      if (pathname !== navigationState.current.currentPath) {
        navigationState.current.previousPath = navigationState.current.currentPath
        historyStack.current.push(pathname)
      }
    }

    // Update current path
    navigationState.current.currentPath = pathname
    
    // Reset back navigation flag after handling
    setTimeout(() => {
      navigationState.current.isBackNavigation = false
    }, 100)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname])

  const navigateWithHistory = (path: string) => {
    navigationState.current.previousPath = pathname
    historyStack.current.push(path)
    router.push(path)
  }

  const goBack = () => {
    if (historyStack.current.length > 1) {
      historyStack.current.pop()
      const previousPath = historyStack.current[historyStack.current.length - 1]
      navigationState.current.isBackNavigation = true
      router.push(previousPath)
    } else {
      // Fallback to dashboard if no history
      router.push('/dashboard')
    }
  }

  return {
    isBackNavigation: navigationState.current.isBackNavigation,
    previousPath: navigationState.current.previousPath,
    currentPath: navigationState.current.currentPath,
    navigateWithHistory,
    goBack,
    historyLength: historyStack.current.length
  }
}

// Helper function to check if we're in a dashboard context
export function isDashboardRoute(path: string): boolean {
  return path.startsWith('/dashboard')
}

// Helper function to preserve navigation state during auth redirects
export function preserveNavigationState(currentPath: string) {
  if (isDashboardRoute(currentPath) && currentPath !== '/dashboard') {
    localStorage.setItem('redirect_after_auth', currentPath)
  }
}

// Helper function to restore navigation state after auth
export function restoreNavigationState(): string | null {
  const storedPath = localStorage.getItem('redirect_after_auth')
  if (storedPath) {
    localStorage.removeItem('redirect_after_auth')
    return storedPath
  }
  return null
}
