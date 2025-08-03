'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Application } from '@/types/dashboard'

interface ReceiptCardProps {
  application: Application
  className?: string
}

export default function ReceiptCard({ application, className = '' }: ReceiptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  if (!application.payment_verified) {
    return null
  }

  // Format date if available
  const formattedDate = application.updated_at 
    ? format(new Date(application.updated_at), 'MMMM dd, yyyy')
    : 'N/A'

  // Format transaction date if available
  const transactionDate = application.created_at
    ? format(new Date(application.created_at), 'MMMM dd, yyyy')
    : 'N/A'
    
  // Generate receipt number from application ID
  const receiptNumber = `R-${application.id.substring(0, 8).toUpperCase()}`
  
  // Get property details
  const propertyTitle = application.property?.title || 'N/A'
  const propertyLocation = application.property?.location || application.property?.address || ''
  
  // For agent information, we should use context from the main dashboard since
  // the Application interface doesn't directly include the agent profile details.
  // In a real implementation, we would need to fetch the agent profile using the property_owner_id.
  const propertyOwnerId = application.property?.created_by || (application as any).property_owner_id
  const agentName = application.property?.owner?.full_name || 'Agent details not available'
  const agentPhone = application.property?.owner?.phone_number || 'Contact not available'
  
  // Get bed and room information for price
  const roomPrice = application.bed?.room?.price_per_bed || 0
  const propertyPrice = application.property?.price || roomPrice
  
  // Handle print receipt
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print receipts')
      return
    }
    
    // Create a styled HTML document for printing
    const receiptHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt ${receiptNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .receipt {
            border: 1px solid #ccc;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .receipt-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
            margin-bottom: 20px;
            position: relative;
          }
          .receipt-status {
            position: absolute;
            top: 0;
            right: 0;
            background-color: #22c55e;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
          }
          .receipt-number {
            margin-top: 5px;
            font-size: 0.8em;
            color: #666;
          }
          .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .property-info {
            margin-bottom: 15px;
          }
          .transaction-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .amount {
            border-top: 1px solid #eee;
            padding-top: 10px;
            margin-top: 15px;
          }
          .tenant-info, .payment-info {
            margin-top: 15px;
          }
          .footer {
            text-align: center;
            font-size: 0.8em;
            color: #666;
            margin-top: 30px;
          }
          h3 {
            margin: 0;
          }
          h4 {
            color: #666;
            font-size: 0.9em;
            margin: 0 0 5px 0;
          }
          p {
            margin: 0 0 5px 0;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8em;
            color: rgba(0, 0, 0, 0.03);
            pointer-events: none;
            z-index: -1;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt {
              border: none;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="watermark">PAID</div>
          <div class="receipt-header">
            <h3>Payment Receipt</h3>
            <p style="margin-top: 2px; font-size: 0.8em; color: #666;">via Unistay Platform</p>
            <div class="receipt-status">Paid</div>
            <p class="receipt-number">Receipt #${receiptNumber}</p>
            <p style="margin-top: 5px; opacity: 0.8;">Verified on ${formattedDate}</p>
          </div>
          
          <div class="property-info">
            <h4>Property</h4>
            <p style="font-weight: bold;">${propertyTitle}</p>
            <p>${propertyLocation}</p>
            ${application.bed?.room ? 
              `<p>Room: ${application.bed.room.name || 'Room ' + application.bed.room.id}</p>
              <p>Bed: ${application.bed.bed_number || 'N/A'}</p>` : ''}
          </div>
          
          <div class="transaction-details">
            <div>
              <h4>Transaction Date</h4>
              <p style="font-weight: bold;">${transactionDate}</p>
            </div>
            <div>
              <h4>Transaction Code</h4>
              <p style="font-weight: bold;">${application.transaction_code || 'N/A'}</p>
            </div>
          </div>
          
          <div class="amount flex-between">
            <span style="font-weight: bold; font-size: 0.9em;">Amount Paid</span>
            <span style="font-weight: bold; color: #111; font-size: 1.5em;">$${propertyPrice.toFixed(2)}</span>
          </div>
          
          <div class="tenant-info">
            <h4>Tenant Information</h4>
            <p style="font-weight: bold;">${application.tenant?.full_name || 'Tenant information not available'}</p>
            <p>EcoCash: ${application.tenant?.ecocash_number || 'Not provided'}</p>
            <p>Student ID: ${application.tenant?.registration_number || 'Not provided'}</p>
            <p>National ID: ${application.tenant?.national_id || 'Not provided'}</p>
          </div>
          
          <div class="payment-info">
            <h4>Payment Details</h4>
            <p>Payment method: Mobile Money</p>
            <p>First month's rent</p>
            <p>Platform: Unistay</p>
          </div>
          
          <div class="payment-info">
            <h4>Agent Information</h4>
            <p>Agent: ${agentName}</p>
            <p>Contact: ${agentPhone}</p>
            <p>EcoCash: ${application.property?.owner?.ecocash_number || 'Not provided'}</p>
          </div>
          
          <div class="footer">
            <p>This is an electronic receipt. No signature required.</p>
            <p>Generated on ${new Date().toLocaleDateString()} by Unistay Platform</p>
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Receipt
          </button>
        </div>
        
        <script>
          // Automatically open print dialog when the page loads
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          }
        </script>
      </body>
      </html>
    `
    
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
  }
  
  // Handle share receipt (copy to clipboard)
  const handleShareReceipt = () => {
    const receiptText = `
UNISTAY PAYMENT RECEIPT
Receipt #${receiptNumber}
Date: ${formattedDate}
Property: ${propertyTitle}
Amount Paid: $${propertyPrice.toFixed(2)}
Transaction Code: ${application.transaction_code || 'N/A'}
Transaction Date: ${transactionDate}

Tenant Information:
Name: ${application.tenant?.full_name || 'Tenant information not available'}
EcoCash: ${application.tenant?.ecocash_number || 'Not provided'}
Student ID: ${application.tenant?.registration_number || 'Not provided'}
National ID: ${application.tenant?.national_id || 'Not provided'}

Agent Information:
Name: ${agentName}
Contact: ${agentPhone}
EcoCash: ${application.property?.owner?.ecocash_number || 'Not provided'}

Generated via Unistay Platform
    `
    
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(receiptText)
        .then(() => {
          alert('Receipt details copied to clipboard')
        })
        .catch(err => {
          console.error('Failed to copy receipt details: ', err)
          alert('Failed to copy receipt details. Please try again or copy manually.')
        })
    } else {
      // Fallback for browsers that do not support the Clipboard API
      try {
        const textarea = document.createElement('textarea')
        textarea.value = receiptText
        // Prevent scrolling to bottom
        textarea.style.position = 'fixed'
        textarea.style.top = '0'
        textarea.style.left = '0'
        textarea.style.width = '2em'
        textarea.style.height = '2em'
        textarea.style.padding = '0'
        textarea.style.border = 'none'
        textarea.style.outline = 'none'
        textarea.style.boxShadow = 'none'
        textarea.style.background = 'transparent'
        document.body.appendChild(textarea)
        textarea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)
        if (successful) {
          alert('Receipt details copied to clipboard')
        } else {
          alert('Failed to copy receipt details. Please copy manually.')
        }
      } catch (err) {
        console.error('Fallback: Failed to copy receipt details: ', err)
        alert('Copy to clipboard is not supported in this browser. Please copy manually.')
      }
    }
  }

  return (
    <div ref={receiptRef} className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg w-full max-w-full ${className}`}>
      {/* Receipt Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Payment Receipt</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">via Unistay Platform</p>
          </div>
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Paid
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Verified on {formattedDate}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Receipt #{receiptNumber}</p>
      </div>

      {/* Receipt Content */}
      <div className="p-3 sm:p-4">
        <div className="space-y-4 sm:space-y-6">
          {/* Transaction Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Transaction Date</p>
              <p className="text-gray-800 dark:text-white font-medium">{transactionDate}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Transaction Code</p>
              <p className="text-gray-800 dark:text-white font-medium">{application.transaction_code || 'N/A'}</p>
            </div>
          </div>

          {/* Property Info */}
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Property</p>
            <p className="text-gray-800 dark:text-white font-medium">{propertyTitle}</p>
            {propertyLocation && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">{propertyLocation}</p>
            )}
          </div>

          {/* Amount */}
          <div className="mb-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Amount Paid</p>
            <p className="text-gray-800 dark:text-white text-2xl font-bold">${propertyPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tenant Information</h4>
              <p className="text-gray-900 dark:text-white">{application.tenant?.full_name || 'Tenant information not available'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                EcoCash: {application.tenant?.ecocash_number || 'Not provided'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Student ID: {application.tenant?.registration_number || 'Not provided'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                National ID: {application.tenant?.national_id || 'Not provided'}
              </p>
            </div>

            <div>
              <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Property Details</h4>
             
              {application.bed?.room && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Room: {application.bed.room.name || `Room ${application.bed.room.id?.substring(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bed: {application.bed.bed_number || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Room Type: {application.bed.room.room_type ? 
                    application.bed.room.room_type.charAt(0).toUpperCase() + application.bed.room.room_type.slice(1) : 'N/A'}
                  </p>
                </>
              )}
            </div>

            <div>
              <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payment Details</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payment method: Mobile Money</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">First month's rent</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Platform: Unistay</p>
            </div>

            <div>
              <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Agent Information</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agent: {agentName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contact: {agentPhone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">EcoCash: {application.property?.owner?.ecocash_number || 'Not provided'}</p>
            </div>

            <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              This is an electronic receipt. No signature required.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3">
          {/* Toggle Button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline focus:outline-none"
          >
            {isExpanded ? 'Show Less' : 'Show More Details'}
          </button>
          
          {/* Print and Share Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={handlePrintReceipt}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print Receipt</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={handleShareReceipt}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
