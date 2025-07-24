'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { v4 as uuidv4 } from 'uuid';
import { use } from 'react';


interface EditFormData {
    title: string;
    description: string;
    location: string;
    price: string;
    bathrooms: string;
    propertyType: string;
    amenities: string[];
    rules: string[];
    image_urls: string[];
}

// Room configuration type
interface Room {
    id: number;
    name: string;
    beds: number;
    room_id?: string; // Database ID for existing rooms
}

export default function EditPropertyPage() {
    const router = useRouter();
    // Get params from Next.js
    const params = useParams();
    const propertyId = params.id as string;
    
    const supabase = createClient();

    const [formData, setFormData] = useState<EditFormData>({
        title: '',
        description: '',
        location: '',
        price: '0',
        bathrooms: '1',
        propertyType: 'apartment',
        amenities: [],
        rules: [],
        image_urls: [],
    });
    
    // Room configuration state
    const [rooms, setRooms] = useState<Room[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    // Room management functions
    const addRoom = () => {
        // Generate unique ID to prevent duplicates when rooms are removed
        const maxId = rooms.length > 0 ? Math.max(...rooms.map(r => r.id)) : 0;
        const newRoom = {
            id: maxId + 1,
            name: `Room ${rooms.length + 1}`,
            beds: 1
        };
        setRooms([...rooms, newRoom]);
    };

    const removeRoom = (roomId: number) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter(room => room.id !== roomId));
        }
    };

    const updateRoom = (roomId: number, field: string, value: any) => {
        setRooms(rooms.map(room => 
            room.id === roomId ? { ...room, [field]: value } : room
        ));
    };

    // Calculate total beds across all rooms
    const getTotalBeds = () => rooms.reduce((total, room) => total + room.beds, 0);

    // Determine room type based on number of beds
    const getRoomType = (bedCount: number): 'single' | 'double' | 'triple' | 'quad' => {
        if (bedCount >= 4) return 'quad';
        if (bedCount === 3) return 'triple';
        if (bedCount === 2) return 'double';
        return 'single';
    };

    const fetchProperty = useCallback(async () => {
        if (!propertyId) return;
        setLoading(true);
        try {
            // Fetch property data
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
                    bathrooms: data.bathrooms?.toString() || '1',
                    propertyType: data.property_type || 'apartment',
                    amenities: Array.isArray(data.amenities) ? data.amenities : [],
                    rules: Array.isArray(data.rules) ? data.rules : [],
                    image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
                });

                // Fetch rooms for this property
                const { data: roomsData, error: roomsError } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('pad_id', propertyId);

                if (roomsError) throw roomsError;

                if (roomsData && roomsData.length > 0) {
                    // Transform rooms data to match our Room interface
                    const formattedRooms = roomsData.map(room => ({
                        id: room.id, // Use database ID as the room ID
                        room_id: room.id, // Store the original database ID
                        name: room.name,
                        beds: room.capacity, // Capacity represents maximum number of beds
                    }));
                    setRooms(formattedRooms);
                } else {
                    // If no rooms exist yet, create a default room
                    setRooms([{
                        id: 1,
                        name: "Room 1",
                        beds: data.bedrooms || 1, // Use legacy bedrooms count for bed count
                    }]);
                }
            }
        } catch (err: unknown) {
            let errorMessage = 'Failed to fetch property details.';
            if (typeof err === 'object' && err !== null && 'message' in err) {
                errorMessage = (err as { message: string }).message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
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
            // Validate room configuration
            if (rooms.length === 0) {
                throw new Error("Please configure at least one room");
            }

            const hasInvalidRooms = rooms.some(room => !room.name.trim() || room.beds < 1);
            if (hasInvalidRooms) {
                throw new Error("Please ensure all rooms have valid names and at least 1 bed");
            }
            
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
            
            // Calculate total beds across all rooms
            const totalBeds = getTotalBeds();

            // 1. Update property data
            const { error: updateError } = await supabase
                .from('pads')
                .update({
                    title: formData.title,
                    description: formData.description,
                    location: formData.location,
                    price: parseFloat(formData.price),
                    bedrooms: totalBeds, // Calculated from rooms
                    bathrooms: parseInt(formData.bathrooms),
                    property_type: formData.propertyType,
                    amenities: formData.amenities,
                    rules: formData.rules,
                    image_urls: uploadedImageUrls,
                    image_url: uploadedImageUrls[0] || null
                })
                .eq('id', propertyId);

            if (updateError) throw updateError;
            
            // 2. Process rooms: handle existing, new, and deleted rooms
            
            // Get existing rooms for comparison
            const { data: existingRoomsData } = await supabase
                .from('rooms')
                .select('id')
                .eq('pad_id', propertyId);
                
            const existingRoomIds = new Set((existingRoomsData || []).map(r => r.id));
            
            // Calculate room price - distribute price equally among rooms
            const roomPrice = parseFloat(formData.price) / rooms.length;
            
            // Process each room
            for (const room of rooms) {
                // For existing rooms, update them
                if (room.room_id && existingRoomIds.has(room.room_id)) {
                    existingRoomIds.delete(room.room_id); // Remove from set to track deletions
                    
                    await supabase
                        .from('rooms')
                        .update({
                            name: room.name,
                            type: getRoomType(room.beds),
                            price: roomPrice,
                            capacity: room.beds
                        })
                        .eq('id', room.room_id);
                        
                    // Get existing beds to see what needs to be added or removed
                    const { data: existingBeds } = await supabase
                        .from('beds')
                        .select('bed_number')
                        .eq('room_id', room.room_id);
                        
                    const existingBedNumbers = new Set((existingBeds || []).map(b => b.bed_number));
                    
                    // Add new beds if needed
                    const bedsToAdd = [];
                    for (let i = 1; i <= room.beds; i++) {
                        if (!existingBedNumbers.has(i)) {
                            bedsToAdd.push({
                                room_id: room.room_id,
                                bed_number: i,
                                is_occupied: false
                            });
                        }
                    }
                    
                    if (bedsToAdd.length > 0) {
                        await supabase.from('beds').insert(bedsToAdd);
                    }
                    
                    // Remove extra beds if needed
                    if (existingBeds && existingBeds.length > room.beds) {
                        const bedNumbersToKeep = Array.from({length: room.beds}, (_, i) => i + 1);
                        await supabase
                            .from('beds')
                            .delete()
                            .eq('room_id', room.room_id)
                            .not('bed_number', 'in', bedNumbersToKeep);
                    }
                } 
                // For new rooms, insert them
                else {
                    // Insert room
                    const { data: roomData, error: roomError } = await supabase.from('rooms').insert({
                        pad_id: propertyId,
                        name: room.name,
                        type: getRoomType(room.beds),
                        price: roomPrice,
                        capacity: room.beds,
                    }).select().single();
                    
                    if (roomError) throw roomError;
                    
                    // Insert beds for this room
                    const bedInserts = [];
                    for (let i = 1; i <= room.beds; i++) {
                        bedInserts.push({
                            room_id: roomData.id,
                            bed_number: i,
                            is_occupied: false
                        });
                    }
                    
                    if (bedInserts.length > 0) {
                        await supabase.from('beds').insert(bedInserts);
                    }
                }
            }
            
            // Delete rooms that no longer exist
            if (existingRoomIds.size > 0) {
                await supabase
                    .from('rooms')
                    .delete()
                    .in('id', Array.from(existingRoomIds));
            }

            router.push('/dashboard/manage-properties');

        } catch (err: unknown) {
            let errorMessage = 'An unknown error occurred during property update.';
            if (typeof err === 'object' && err !== null && 'message' in err) {
                errorMessage = (err as { message: string }).message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
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
        <AuthGuard allowedRoles={['agent']}>
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
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (USD)</label>
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
                            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bathrooms (Property-wide)</label>
                            <select
                                name="bathrooms"
                                id="bathrooms"
                                value={formData.bathrooms}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
                                required
                            >
                                <option value="1">1 bathroom</option>
                                <option value="2">2 bathrooms</option>
                                <option value="3">3 bathrooms</option>
                                <option value="4">4 bathrooms</option>
                                <option value="5">5+ bathrooms</option>
                            </select>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <strong>Note:</strong> Bathrooms are shared facilities for the entire property.
                            </p>
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
                        
                        {/* Room Configuration Section */}
                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Room Configuration</h3>
                                <button
                                    type="button"
                                    onClick={addRoom}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                                >
                                    + Add Room
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {rooms.map((room, index) => (
                                    <div key={room.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-medium text-gray-900 dark:text-white">Room {index + 1}</h4>
                                            {rooms.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoom(room.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Room Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={room.name}
                                                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Number of Beds ({getRoomType(room.beds)} room)
                                                </label>
                                                <select
                                                    value={room.beds}
                                                    onChange={(e) => updateRoom(room.id, 'beds', parseInt(e.target.value))}
                                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                >
                                                    <option value={1}>1 bed (single)</option>
                                                    <option value={2}>2 beds (double)</option>
                                                    <option value={3}>3 beds (triple)</option>
                                                    <option value={4}>4 beds (quad)</option>
                                                    <option value={5}>5 beds</option>
                                                    <option value={6}>6 beds</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <strong>Total beds across all rooms:</strong> {getTotalBeds()}
                                </div>
                            </div>
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
