'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PropertyDiagnostic() {
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const supabase = createClient();
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setResults({ error: 'Not authenticated' });
        return;
      }

      // Get user's properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, images, created_at')
        .eq('owner_id', user.id);

      // Get storage buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

      // List files in property-images bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('property-images')
        .list('', { limit: 100 });

      // Test a few image URLs
      const imageTests = [];
      if (properties && properties.length > 0) {
        for (const property of properties.slice(0, 3)) {
          if (property.images && property.images.length > 0) {
            const firstImagePath = property.images[0];
            const { data } = supabase.storage
              .from('property-images')
              .getPublicUrl(firstImagePath);

            imageTests.push({
              propertyId: property.id,
              propertyTitle: property.title,
              imagePath: firstImagePath,
              publicUrl: data.publicUrl,
              totalImages: property.images.length
            });
          }
        }
      }

      setResults({
        user: { id: user.id, email: user.email },
        properties: properties || [],
        propertiesError,
        buckets: buckets || [],
        bucketsError,
        files: files || [],
        filesError,
        imageTests,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        Property Image Diagnostic Tool
      </h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
        This tool helps diagnose image loading issues. Only visible in development mode.
      </p>
      
      <button
        onClick={runDiagnostic}
        disabled={isRunning}
        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
      >
        {isRunning ? 'Running Diagnostic...' : 'Run Diagnostic'}
      </button>

      {results && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Diagnostic Results:</h4>
          <pre className="bg-white dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
