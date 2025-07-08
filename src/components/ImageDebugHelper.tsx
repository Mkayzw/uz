'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ImageDebugHelper() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugImages = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResults({ error: 'Not authenticated' });
        return;
      }

      // Get the latest properties with their image data
      const { data: properties, error } = await supabase
        .from('pads')
        .select('id, title, image_url, image_urls, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Check storage bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('property-images')
        .list(user.id, { limit: 10 });

      setResults({
        properties,
        files,
        filesError,
        user: { id: user.id }
      });

    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
        Image Upload Debug
      </h3>
      
      <button
        onClick={debugImages}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Debug Image Data'}
      </button>

      {results && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Debug Results:</h4>
          <pre className="bg-white dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
