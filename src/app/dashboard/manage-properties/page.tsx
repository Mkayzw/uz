'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import PropertyImage from '@/components/PropertyImage';
import Link from 'next/link';

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
          .from('pads')
          .select('*')
          .eq('created_by', user.id)
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
  }, [router]);

  const togglePropertyStatus = async (propertyId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('pads')
        .update({ active: !currentStatus })
        .eq('id', propertyId);
        
      if (error) throw error;
      
      // Update local state to reflect the change
      setProperties(properties.map(property => 
        property.id === propertyId 
          ? { ...property, active: !currentStatus }
          : property
      ));
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error toggling property status:', err);
            setError(err.message || 'Failed to update property status');
        } else {
            setError('An unknown error occurred');
        }
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // First delete any associated rooms
      const { error: roomsError } = await supabase
        .from('rooms')
        .delete()
        .eq('pad_id', propertyId);
        
      if (roomsError) throw roomsError;
      
      // Then delete the property
      const { error } = await supabase
        .from('pads')
        .delete()
        .eq('id', propertyId);
        
      if (error) throw error;
      
      // Remove from local state
      setProperties(properties.filter(property => property.id !== propertyId));
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error deleting property:', err);
            setError(err.message || 'Failed to delete property');
        } else {
            setError('An unknown error occurred');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['landlord', 'agent']}>
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
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${!property.active ? 'border-l-4 border-red-500' : ''}`}
                >
                  <div className="md:flex">
                    <div className="md:flex-shrink-0 w-full md:w-64 h-48">
                      <PropertyImage
                        src={property.image_url}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-6 w-full">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{property.title}</h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{property.location}</p>
                        </div>
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                            property.active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {property.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          KSH {property.price}/month
                        </span>
                      </div>
                      
                      {property.description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {property.description}
                        </p>
                      )}
                      
                      <div className="mt-4 flex flex-wrap justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Listed on {new Date(property.created_at).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          <span>
                            {property.view_count || 0} {property.view_count === 1 ? 'view' : 'views'}
                          </span>
                        </div>
                        
                        <div className="mt-2 sm:mt-0 flex space-x-2">
                          <button
                            onClick={() => router.push(`/dashboard/edit-property/${property.id}`)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => togglePropertyStatus(property.id, property.active)}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white ${
                              property.active 
                                ? 'bg-yellow-600 hover:bg-yellow-700' 
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {property.active ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => deleteProperty(property.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </button>
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
