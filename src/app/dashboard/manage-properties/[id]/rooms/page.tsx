'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import BackButton from '@/components/BackButton';
import { RoomRow, BedRow } from '@/types/database';
import { addRoom, addBed, deleteBed, updateBedAvailability, deleteRoom, getRoomStats } from '@/app/dashboard/actions';

export default function ManageRoomsPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const supabase = createClient();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [beds, setBeds] = useState<{ [key: string]: BedRow[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'single' | 'double' | 'triple' | 'quad'>('single');
  const [newRoomPrice, setNewRoomPrice] = useState(0);
  const [newRoomCapacity, setNewRoomCapacity] = useState(1);

  const [newBedNumber, setNewBedNumber] = useState(1);
  const [selectedRoomForBed, setSelectedRoomForBed] = useState<string>('');
  const [propertyStats, setPropertyStats] = useState<any>(null);

  const refreshStats = async () => {
    const statsResult = await getRoomStats(id);
    if (!statsResult.error) {
      setPropertyStats(statsResult);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? All beds in this room will also be deleted.')) {
      return;
    }
    
    const result = await deleteRoom(roomId);
    if (result.error) {
      setError(result.error);
    } else {
      setRooms(rooms.filter(room => room.id !== roomId));
      const updatedBeds = { ...beds };
      delete updatedBeds[roomId];
      setBeds(updatedBeds);
      refreshStats();
    }
  };

  const handleDeleteBed = async (bedId: string, roomId: string) => {
    if (!confirm('Are you sure you want to delete this bed?')) {
      return;
    }
    
    const result = await deleteBed(bedId);
    if (result.error) {
      setError(result.error);
    } else {
      setBeds({
        ...beds,
        [roomId]: beds[roomId].filter(bed => bed.id !== bedId)
      });
      refreshStats();
    }
  };

  const handleToggleBedAvailability = async (bedId: string, currentAvailability: boolean, roomId: string) => {
    const result = await updateBedAvailability(bedId, !currentAvailability);
    if (result.error) {
      setError(result.error);
    } else {
      setBeds({
        ...beds,
        [roomId]: beds[roomId].map(bed => 
          bed.id === bedId ? { ...bed, is_available: !currentAvailability } : bed
        )
      });
      refreshStats();
    }
  };

  useEffect(() => {
    const fetchRoomsAndBeds = async () => {
      try {
        // Use getSession for better reliability during navigation
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          // Store current path for redirect after login
          const currentPath = window.location.pathname + window.location.search
          localStorage.setItem('redirect_after_auth', currentPath)
          router.push('/auth/login');
          return;
        }

        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .eq('pad_id', id);

        if (roomsError) {
          throw roomsError;
        }

        setRooms(roomsData || []);

        if (roomsData) {
          const bedsPromises = roomsData.map(room => 
            supabase.from('beds').select('*').eq('room_id', room.id)
          );
          const bedsResults = await Promise.all(bedsPromises);
          
          const bedsByRoom: { [key: string]: BedRow[] } = {};
          bedsResults.forEach((result, index) => {
            if (result.data) {
              bedsByRoom[roomsData[index].id] = result.data;
            }
          });
          setBeds(bedsByRoom);

          // Fetch property statistics
          const statsResult = await getRoomStats(id);
          if (!statsResult.error) {
            setPropertyStats(statsResult);
          }
        }

      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load data');
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoomsAndBeds();
  }, [id, router]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!newRoomName.trim()) {
      setError('Room name is required.');
      return;
    }
    
    if (newRoomPrice <= 0) {
      setError('Price must be greater than 0.');
      return;
    }
    
    if (newRoomCapacity <= 0) {
      setError('Capacity must be at least 1.');
      return;
    }
    
    const roomData = {
      name: newRoomName.trim(),
      type: newRoomType,
      price: newRoomPrice,
      capacity: newRoomCapacity,
      available: true,
    };
    
    const result = await addRoom(id, roomData);
    if (result.error) {
      setError(result.error);
    } else {
      setRooms([...rooms, result.data]);
      // Reset form
      setNewRoomName('');
      setNewRoomType('single');
      setNewRoomPrice(0);
      setNewRoomCapacity(1);
      refreshStats();
    }
  };

  const handleAddBed = async (roomId: string) => {
    // Check if bed number already exists in this room
    const existingBedNumbers = beds[roomId]?.map(bed => bed.bed_number) || [];
    if (existingBedNumbers.includes(newBedNumber)) {
      setError(`Bed number ${newBedNumber} already exists in this room.`);
      return;
    }

    const bedData = {
      bed_number: newBedNumber,
      is_available: true,
    };
    const result = await addBed(roomId, bedData);
    if (result.error) {
      setError(result.error);
    } else {
      setBeds({
        ...beds,
        [roomId]: [...(beds[roomId] || []), result.data],
      });
      setNewBedNumber(Math.max(...existingBedNumbers, 0) + 1);
      setError(''); // Clear any previous errors
    }
  };

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

  return (
    <AuthGuard allowedRoles={['agent']}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Rooms</h1>
            <BackButton
              fallbackPath={`/dashboard/manage-properties/${id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to Property
            </BackButton>
          </div>

          {/* Property Statistics */}
          {propertyStats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {propertyStats.summary.totalRooms}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Rooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {propertyStats.summary.totalCapacity}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Max Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {propertyStats.summary.totalBeds}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Beds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {propertyStats.summary.availableBeds}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {propertyStats.summary.occupiedBeds}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Occupied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {propertyStats.summary.fullRooms}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Full Rooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {propertyStats.summary.occupancyRate}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Occupancy</div>
                </div>
              </div>
              
              {/* Progress bars */}
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Capacity Utilization</span>
                    <span>{propertyStats.summary.capacityUtilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(propertyStats.summary.capacityUtilization, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Occupancy Rate</span>
                    <span>{propertyStats.summary.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(propertyStats.summary.occupancyRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Room</h2>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
                <p className="text-sm">{error}</p>
              </div>
            )}
            <form onSubmit={handleAddRoom}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="roomName" 
                    value={newRoomName} 
                    onChange={(e) => setNewRoomName(e.target.value)} 
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                    placeholder="e.g., Room A, Master Bedroom"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="roomType" 
                    value={newRoomType} 
                    onChange={(e) => setNewRoomType(e.target.value as any)} 
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="single">Single (1 bed)</option>
                    <option value="double">Double (2 beds)</option>
                    <option value="triple">Triple (3 beds)</option>
                    <option value="quad">Quad (4 beds)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="roomPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price per Bed ($) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    id="roomPrice" 
                    value={newRoomPrice} 
                    onChange={(e) => setNewRoomPrice(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                    min="0"
                    step="0.01"
                    placeholder="150.00"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="roomCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maximum Beds <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    id="roomCapacity" 
                    value={newRoomCapacity} 
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                    min="1"
                    max="10"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Maximum number of beds that can be placed in this room
                  </p>
                </div>
              </div>
              <button 
                type="submit" 
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Room
              </button>
            </form>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Existing Rooms</h2>
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No rooms found for this property. Add your first room above!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {rooms.map(room => {
                  const roomBeds = beds[room.id] || [];
                  const availableBeds = roomBeds.filter(bed => bed.is_available).length;
                  const occupiedBeds = roomBeds.length - availableBeds;
                  const isFull = roomBeds.length > 0 && availableBeds === 0;

                  return (
                    <div key={room.id} className={`rounded-lg shadow-lg p-6 border-2 transition-all duration-200 ${
                      isFull
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{room.name}</h3>
                            {isFull && (
                              <span className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded-full uppercase tracking-wide">
                                FULL
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{room.type} Room</p>
                        </div>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Room"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">{room.capacity} beds</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">${room.price}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Available:</span>
                          <span className={`ml-1 font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                            {availableBeds} beds
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Occupied:</span>
                          <span className="ml-1 font-medium text-red-600">{occupiedBeds} beds</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`ml-1 font-bold ${
                            isFull
                              ? 'text-red-600 dark:text-red-400'
                              : availableBeds > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {isFull ? 'FULL' : availableBeds > 0 ? 'Available' : 'Empty'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">Beds ({roomBeds.length}/{room.capacity})</h4>
                          {roomBeds.length < room.capacity && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {room.capacity - roomBeds.length} more bed(s) can be added
                            </span>
                          )}
                        </div>
                        
                        {roomBeds.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                            {roomBeds.map(bed => (
                              <div key={bed.id} className={`p-3 rounded-lg border-2 ${bed.is_available ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'}`}>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Bed #{bed.bed_number}</p>
                                    <p className={`text-xs ${bed.is_available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {bed.is_available ? 'Available' : 'Occupied'}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleToggleBedAvailability(bed.id, bed.is_available, room.id)}
                                      className={`p-1 rounded ${bed.is_available ? 'text-red-600 hover:bg-red-100' : 'text-green-600 hover:bg-green-100'} transition-colors`}
                                      title={bed.is_available ? 'Mark as Occupied' : 'Mark as Available'}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {bed.is_available ? (
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        )}
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBed(bed.id, room.id)}
                                      className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors"
                                      title="Delete Bed"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No beds added to this room yet.</p>
                        )}
                        
                        {roomBeds.length < room.capacity && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add New Bed</h5>
                            <div className="flex items-end gap-3">
                              <div className="flex-1">
                                <label htmlFor={`bedNumber-${room.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Bed Number
                                </label>
                                <input 
                                  type="number" 
                                  id={`bedNumber-${room.id}`} 
                                  value={newBedNumber} 
                                  onChange={(e) => setNewBedNumber(Number(e.target.value))} 
                                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                  min="1"
                                />
                              </div>
                              <button 
                                onClick={() => handleAddBed(room.id)} 
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Add Bed
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
