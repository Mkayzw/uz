'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import PropertyImage from '@/components/PropertyImage';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils/imageHelpers';

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string | null;
  image_urls: string[] | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  updated_at: string;
  active: boolean;
  view_count: number;
}

export default function ManagePropertyPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const propertyId = params.id;

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/auth/login');
          return;
        }

        const { data, error: propertyError } = await supabase
          .from('pads')
          .select('*')
          .eq('id', propertyId)
          .eq('created_by', user.id)
          .single();

        if (propertyError) {
          throw propertyError;
        }

        if (data) {
          setProperty(data);
        } else {
            setError('Property not found or you do not have permission to view it.');
        }
      } catch (err: unknown) {
        console.error('Error fetching property:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load property');
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Property not found.</p>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['agent']}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{property.title}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{property.location}</p>
              
              <div className="mt-4">
                <Link href={`/dashboard/manage-properties/${property.id}/rooms`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Manage Rooms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
