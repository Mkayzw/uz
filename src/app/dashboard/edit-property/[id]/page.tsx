'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { v4 as uuidv4 } from 'uuid';

interface EditFormData {
    title: string;
    description: string;
    location: string;
    price: string;
    bedrooms: string;
    bathrooms: string;
    propertyType: string;
    amenities: string[];
    rules: string[];
    image_urls: string[];
}

export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;
    const supabase = createClient();

    const [formData, setFormData] = useState<EditFormData>({
        title: '',
        description: '',
        location: '',
        price: '0',
        bedrooms: '1',
        bathrooms: '1',
        propertyType: 'apartment',
        amenities: [],
        rules: [],
        image_urls: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    const fetchProperty = useCallback(async () => {
        if (!propertyId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pads')
                .select('*')
                .eq('id', propertyId)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    location: data.location || '',
                    price: data.price?.toString() || '0',
                    bedrooms: data.bedrooms?.toString() || '1',
                    bathrooms: data.bathrooms?.toString() || '1',
                    propertyType: data.property_type || 'apartment',
                    amenities: Array.isArray(data.amenities) ? data.amenities : [],
                    rules: Array.isArray(data.rules) ? data.rules : [],
                    image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
                });
            }
        } catch (err: unknown) {
            setError('Failed to fetch property details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [propertyId]);

    useEffect(() => {
        fetchProperty();
    }, [fetchProperty]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'amenities' || name === 'rules') {
            setFormData(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImageFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Handle image uploads
            const uploadedImageUrls = [...formData.image_urls];
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const fileExtension = file.name.split('.').pop();
                const fileName = `${Date.now()}_${i}.${fileExtension}`;
                const filePath = `${propertyId}/${fileName}`;
                
                const { data, error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                uploadedImageUrls.push(data.path);
            }

            const { error: updateError } = await supabase
                .from('pads')
                .update({
                    title: formData.title,
                    description: formData.description,
                    location: formData.location,
                    price: parseFloat(formData.price),
                    bedrooms: parseInt(formData.bedrooms),
                    bathrooms: parseInt(formData.bathrooms),
                    property_type: formData.propertyType,
                    amenities: formData.amenities,
                    rules: formData.rules,
                    image_urls: uploadedImageUrls,
                    image_url: uploadedImageUrls[0] || null
                })
                .eq('id', propertyId);

            if (updateError) throw updateError;

            router.push('/dashboard/manage-properties');

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Failed to update property.');
            } else {
                setError('An unknown error occurred during property update.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen"><div className="text-red-500">{error}</div></div>;
    }

    return (
        <AuthGuard allowedRoles={['landlord', 'agent']}>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Edit Property</h1>
                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                name="description"
                                id="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                rows={4}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                            <input
                                type="text"
                                name="location"
                                id="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                            <input
                                type="number"
                                name="price"
                                id="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bedrooms</label>
                            <input
                                type="number"
                                name="bedrooms"
                                id="bedrooms"
                                value={formData.bedrooms}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bathrooms</label>
                            <input
                                type="number"
                                name="bathrooms"
                                id="bathrooms"
                                value={formData.bathrooms}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
                            <select
                                name="propertyType"
                                id="propertyType"
                                value={formData.propertyType}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                required
                            >
                                <option value="apartment">Apartment</option>
                                <option value="house">House</option>
                                <option value="condo">Condo</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="land">Land</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amenities</label>
                            <input
                                type="text"
                                name="amenities"
                                id="amenities"
                                value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                placeholder="Comma-separated values"
                            />
                        </div>

                        <div>
                            <label htmlFor="rules" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rules</label>
                            <input
                                type="text"
                                name="rules"
                                id="rules"
                                value={Array.isArray(formData.rules) ? formData.rules.join(', ') : ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                placeholder="Comma-separated values"
                            />
                        </div>

                        <div>
                            <label htmlFor="images" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add More Images</label>
                            <input
                                type="file"
                                id="images"
                                name="images"
                                multiple
                                onChange={handleImageChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={() => router.back()} className="mr-2 px-4 py-2 text-sm font-medium rounded-md">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                                {loading ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthGuard>
    );
}
