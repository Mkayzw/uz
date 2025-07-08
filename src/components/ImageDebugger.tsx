'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getImageUrl, checkImageUrl } from '@/lib/utils/imageHelpers';

interface ImageDebuggerProps {
  imagePath: string | null;
}

export default function ImageDebugger({ imagePath }: ImageDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const debugImage = async () => {
    if (!imagePath) return;
    
    setIsChecking(true);
    const supabase = createClient();
    
    try {
      // Get the public URL
      const publicUrl = getImageUrl(imagePath);
      
      // Check if the image loads
      const imageLoads = await checkImageUrl(publicUrl);
      
      // Get storage info
      const { data: fileInfo, error: fileError } = await supabase.storage
        .from('property-images')
        .list('', { search: imagePath });
      
      // Get bucket info
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      setDebugInfo({
        imagePath,
        publicUrl,
        imageLoads,
        fileInfo,
        fileError,
        buckets,
        bucketError,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        imagePath,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsChecking(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
      <h4 className="text-sm font-medium mb-2">Image Debug Info</h4>
      <button
        onClick={debugImage}
        disabled={isChecking || !imagePath}
        className="px-3 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50"
      >
        {isChecking ? 'Checking...' : 'Debug Image'}
      </button>
      
      {debugInfo && (
        <pre className="mt-2 text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}
