'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import PropertyImage from '@/components/PropertyImage';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils/imageHelpers';

// ⚠️ CRITICAL: This interface still uses legacy bedrooms/bathrooms fields
// while the new system uses rooms/beds tables.
// This creates inconsistency with newly created properties.
// TODO: Update to fetch room/bed data or use computed values

interface Property {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  images: string[];
  status: string;
  created_at: string;
  view_count: number;
  // Optional fields that might not be present
  property_type?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  amenities?: any;
}

export default function ManagePropertiesPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/auth/login');
          return;
        }

        // Fetch user's properties
        const { data, error: propertiesError } = await supabase
          .from('properties')
          .select('id, title, description, address, city, images, status, created_at, view_count, property_type, contact_phone, contact_email, amenities')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (propertiesError) {
          throw propertiesError;
        }

        setProperties(data || []);
      } catch (err: unknown) {
        console.error('Error fetching properties:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load properties');
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [supabase, router]);

  return (
    <AuthGuard allowedRoles={['agent']}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Your Properties</h1>
            <Link
              href="/dashboard/list-property"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Property
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No properties</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new property listing
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/list-property"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Property
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {properties.map((property) => (
                <div 
                  key={property.id} 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden`}
                >
                  <div className="md:flex">
                    <div className="md:flex-shrink-0 w-full md:w-80">
                      <PropertyImage
                        src={getImageUrl(property.images && property.images[0])}
                        alt={property.title}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                    <div className="p-6 w-full">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{property.title}</h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{property.address}, {property.city}</p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex space-x-2">
                          <Link
                            href={`/dashboard/manage-properties/${property.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Manage
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
