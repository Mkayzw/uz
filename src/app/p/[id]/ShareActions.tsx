'use client'

import React from 'react'

interface ShareActionsProps {
  url: string
  encodedShare: string
}

export default function ShareActions({ url, encodedShare }: ShareActionsProps) {
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      // simple feedback
      void (window as any).alert('Link copied to clipboard')
    } catch (e) {
      void (window as any).prompt('Copy this link', url)
    }
  }

  const onWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedShare}`, '_blank')
  }

  return (
    <>
      <button onClick={onWhatsApp} style={{ background: '#25D366', color: '#fff', padding: '10px 14px', borderRadius: 6, border: 'none', fontWeight: 600 }}>
        Share on WhatsApp
      </button>
      <button onClick={onCopy} style={{ background: '#eef2ff', color: '#3730a3', padding: '10px 14px', borderRadius: 6, border: 'none', fontWeight: 600 }}>
        Copy link
      </button>
    </>
  )
}