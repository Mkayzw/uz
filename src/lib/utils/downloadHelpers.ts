/**
 * Mobile-friendly download utilities
 * Handles PDF downloads across different browsers and devices
 */

/**
 * Detect if the user is on a mobile device
 * Combines user agent parsing with feature detection for better reliability
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  // User agent detection
  const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  // Feature detection: touch support and screen width
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth <= 768

  // Combine checks: user agent OR (touch support AND small screen)
  return userAgentMobile || (hasTouchSupport && isSmallScreen)
}

/**
 * Detect if the user is on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Download a PDF file in a mobile-friendly way
 * @param url - The URL to download the PDF from
 * @param filename - The desired filename for the download
 * @param onError - Optional error callback
 * @param onSuccess - Optional success callback
 */
export async function downloadPDF(
  url: string,
  filename: string,
  onError?: (error: string) => void,
  onSuccess?: () => void
): Promise<void> {
  try {
    console.log('Starting PDF download:', { url, filename, isIOS: isIOS(), isMobile: isMobileDevice() })

    // For iOS, use direct navigation approach (most reliable)
    if (isIOS()) {
      await downloadPDFiOS(url, filename, onError, onSuccess)
    } else if (isMobileDevice()) {
      // For other mobile devices, use fetch + blob approach
      await downloadPDFMobile(url, filename, onError, onSuccess)
    } else {
      // For desktop, try window.open first, fallback to blob approach
      const opened = window.open(url, '_blank')
      if (!opened) {
        console.log('Desktop popup blocked, falling back to blob approach')
        // Popup was blocked, fallback to blob approach
        await downloadPDFMobile(url, filename, onError, onSuccess)
      } else {
        // Add delayed validation to check if popup was actually blocked
        setTimeout(() => {
          try {
            if (opened.closed) {
              console.log('Desktop popup was closed, falling back to blob approach')
              // Popup was closed immediately, likely blocked
              downloadPDFMobile(url, filename, onError, onSuccess)
            } else {
              console.log('Desktop download successful via popup')
              onSuccess?.()
            }
          } catch (error) {
            console.log('Desktop popup error, falling back to blob approach:', error)
            // Cross-origin error or popup blocked
            downloadPDFMobile(url, filename, onError, onSuccess)
          }
        }, 100)
      }
    }
  } catch (error) {
    console.error('Download error:', error)
    onError?.('Failed to download receipt. Please try again.')
  }
}

/**
 * Download PDF on iOS using direct navigation (most reliable for iOS)
 */
async function downloadPDFiOS(
  url: string,
  filename: string,
  onError?: (error: string) => void,
  onSuccess?: () => void
): Promise<void> {
  try {
    console.log('iOS download: Starting direct navigation approach')

    // First, verify the PDF is accessible
    const response = await fetch(url, {
      method: 'HEAD', // Just check headers, don't download content
      headers: {
        'Accept': 'application/pdf',
      },
    })

    if (!response.ok) {
      throw new Error(`PDF not accessible: ${response.status} ${response.statusText}`)
    }

    console.log('iOS download: PDF is accessible, navigating to URL')

    // For iOS, direct navigation works best
    // This will open the PDF in Safari's built-in PDF viewer
    window.location.href = url

    // Show user-friendly instructions
    setTimeout(() => {
      // Use a more modern approach than alert
      if (onSuccess) {
        onSuccess()
      }

      // You could also show a toast notification here instead of alert
      console.log('iOS download: PDF should be opening in Safari. Users can tap the share button to save.')
    }, 500)

  } catch (error) {
    console.error('iOS download error:', error)

    // Fallback: try opening in new tab
    try {
      console.log('iOS download: Trying fallback - new tab approach')
      const newTab = window.open(url, '_blank')
      if (newTab) {
        console.log('iOS download: Fallback successful - opened in new tab')
        setTimeout(() => {
          onSuccess?.()
        }, 500)
      } else {
        throw new Error('Unable to open PDF. Please check your popup settings.')
      }
    } catch (fallbackError) {
      console.error('iOS download fallback failed:', fallbackError)
      onError?.(error instanceof Error ? error.message : 'Failed to download receipt on iOS')
    }
  }
}

/**
 * Download PDF using fetch + blob approach (mobile-friendly)
 */
async function downloadPDFMobile(
  url: string,
  filename: string,
  onError?: (error: string) => void,
  onSuccess?: () => void
): Promise<void> {
  try {
    console.log('Mobile download: Starting fetch + blob approach')

    // Fetch the PDF as a blob
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('Mobile download: Fetch successful, creating blob')
    const blob = await response.blob()

    // Check file size limit (50MB max)
    const maxSizeBytes = 50 * 1024 * 1024 // 50MB
    if (blob.size > maxSizeBytes) {
      throw new Error('File too large. Maximum size is 50MB.')
    }

    // Enhanced PDF content type validation
    const validPdfTypes = [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'applications/vnd.pdf',
      'text/pdf',
      'text/x-pdf'
    ]

    const isValidPdfType = validPdfTypes.includes(blob.type.toLowerCase()) ||
                          blob.type.includes('pdf') ||
                          response.headers.get('content-type')?.toLowerCase().includes('pdf')

    if (!isValidPdfType) {
      console.log('Mobile download: Invalid content type:', blob.type)
      throw new Error('Invalid file type received. Expected PDF format.')
    }

    console.log('Mobile download: Creating download link')

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename

    // For non-iOS mobile browsers, trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log('Mobile download: Download triggered')

    // Clean up the blob URL after download starts
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl)
      console.log('Mobile download: Blob URL cleaned up')
    }, 1000)

    onSuccess?.()
  } catch (error) {
    console.error('Mobile download error:', error)
    onError?.(error instanceof Error ? error.message : 'Failed to download receipt')
  }
}

/**
 * Download receipt with proper error handling and user feedback
 * @param applicationId - The application ID for the receipt
 * @param onError - Error callback
 * @param onSuccess - Success callback
 */
export async function downloadReceipt(
  applicationId: string,
  onError?: (error: string) => void,
  onSuccess?: () => void
): Promise<void> {
  const url = `/api/receipts/${applicationId}`
  const filename = `receipt-${applicationId}.pdf`
  
  await downloadPDF(url, filename, onError, onSuccess)
}

/**
 * Check if the browser supports downloads
 */
export function supportsDownload(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if the browser supports the download attribute
  const link = document.createElement('a')
  return typeof link.download !== 'undefined'
}
