'use client';

import { useState } from 'react';

interface ImageTesterProps {
  url: string;
}

export default function ImageTester({ url }: ImageTesterProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoad = () => {
    console.log('✅ Image loaded successfully:', url);
    setStatus('success');
  };

  const handleError = (e: any) => {
    console.error('❌ Image failed to load:', url);
    console.error('Error details:', e);
    setStatus('error');
    setErrorMessage(e.message || 'Unknown error');
  };

  return (
    <div className="border p-4 m-2 rounded">
      <h3 className="font-bold mb-2">Image Test</h3>
      <p className="text-sm text-gray-600 mb-2 break-all">URL: {url}</p>
      
      <div className="mb-2">
        Status: 
        <span className={`ml-2 px-2 py-1 rounded text-sm ${
          status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      </div>

      {errorMessage && (
        <div className="text-red-600 text-sm mb-2">
          Error: {errorMessage}
        </div>
      )}

      <img
        src={url}
        alt="Test image"
        className="max-w-full h-auto border"
        onLoad={handleLoad}
        onError={handleError}
        style={{ maxHeight: '200px' }}
      />
    </div>
  );
}
