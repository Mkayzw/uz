/**
 * Mobile-friendly download utilities
 * Handles PDF downloads across different browsers and devices
 */

/**
 * Detect if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
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
    // For mobile devices, use fetch + blob approach
    if (isMobileDevice()) {
      await downloadPDFMobile(url, filename, onError, onSuccess)
    } else {
      // For desktop, try window.open first, fallback to blob approach
      const opened = window.open(url, '_blank')
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        // Popup was blocked, fallback to blob approach
        await downloadPDFMobile(url, filename, onError, onSuccess)
      } else {
        onSuccess?.()
      }
    }
  } catch (error) {
    console.error('Download error:', error)
    onError?.('Failed to download receipt. Please try again.')
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

    const blob = await response.blob()
    
    // Check if the response is actually a PDF
    if (blob.type !== 'application/pdf' && !blob.type.includes('pdf')) {
      throw new Error('Invalid file type received')
    }

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    
    // For iOS, we need to handle downloads differently
    if (isIOS()) {
      // On iOS, we open in a new window which allows the user to save
      const newWindow = window.open(downloadUrl, '_blank')
      if (!newWindow) {
        throw new Error('Unable to open download. Please allow popups and try again.')
      }
    } else {
      // For other mobile browsers, trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    // Clean up the blob URL
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl)
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
