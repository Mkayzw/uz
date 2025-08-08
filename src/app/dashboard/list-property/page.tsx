"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import PropertyImage from "@/components/PropertyImage";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";

const PropertyForm = () => {
  const supabase = useSupabaseClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [fullViewImage, setFullViewImage] = useState<string | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "apartment",
    price: "",
    bathrooms: "1", // Property-level bathrooms (shared facilities)
    photos: [] as File[],
    amenities: {
      wifi: false,
      pool: false,
      parking: false,
      power: false,
      water: false,
      tv: false,
      airConditioning: false,
      furnished: false,
      laundry: false,
      securitySystem: false
    },
    rules: "",
    availableFrom: "",
    availableTo: "",
    contactPhone: "",
    contactEmail: "",
  });

  // Room configuration state
  const [rooms, setRooms] = useState([
    { id: 1, name: "Room 1", beds: 1 }
  ]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [name]: checked },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFormData((prev) => ({ ...prev, photos: fileArray }));
      
      // Generate image previews
      const previewURLs = fileArray.map(file => URL.createObjectURL(file));
      setImagePreview(previewURLs);
    }
  };
  
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Validate form data
      if (!formData.title || !formData.address || !formData.price) {
        throw new Error("Please fill in all required fields");
      }
      
      if (formData.photos.length === 0) {
        throw new Error("Please upload at least one photo of your property");
      }

      // Validate room configuration
      if (rooms.length === 0) {
        throw new Error("Please configure at least one room");
      }

      const hasInvalidRooms = rooms.some(room => !room.name.trim() || room.beds < 1);
      if (hasInvalidRooms) {
        throw new Error("Please ensure all rooms have valid names and at least 1 bed");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // 1. Upload images to Supabase Storage
      const photoUrls = [];
      for (let i = 0; i < formData.photos.length; i++) {
        const photo = formData.photos[i];
        const fileExtension = photo.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExtension}`;
        const filePath = `${user.id}/${fileName}`;
        
        // Upload to storage
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("Storage upload error:", error);
          throw new Error(`Error uploading image ${i + 1}: ${error.message}`);
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path);
          
        photoUrls.push(publicUrl); // Store the full URL for immediate use
      }

      // Prepare full address
      const fullAddress = [
        formData.address,
        formData.city,
        formData.state,
        formData.zipCode
      ].filter(Boolean).join(", ");

      // 2. Insert into 'properties' table
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          title: formData.title,
          description: formData.description,
          address: fullAddress,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          property_type: formData.propertyType,
          price: parseFloat(formData.price) || 0,
          contact_phone: formData.contactPhone,
          contact_email: formData.contactEmail || user.email,
          rules: formData.rules,
          images: photoUrls,
          available_from: formData.availableFrom || null,
          available_to: formData.availableTo || null,
          amenities: {
            utilities: { 
              internet: formData.amenities.wifi,
              power: formData.amenities.power, 
              water: formData.amenities.water, 
            }, 
            facilities: { 
              pool: formData.amenities.pool, 
              parking: formData.amenities.parking, 
              laundry: formData.amenities.laundry, 
              security_system: formData.amenities.securitySystem,
            }, 
            room_features: { 
              air_conditioning: formData.amenities.airConditioning,
              tv: formData.amenities.tv, 
              furnished: formData.amenities.furnished, 
            }, 
          },
          status: 'published',
        })
        .select()
        .single();

      if (propertyError) {
        throw new Error("Error creating property: " + propertyError.message);
      }

      // 3. Insert rooms and beds
      for (const room of rooms) {
        // Insert room
        // TODO: Individual room pricing should be implemented in the UI
        // For now, setting price_per_bed to 0 as property price is stored separately.
        const { data: roomData, error: roomError } = await supabase.from("rooms").insert({
          property_id: propertyData.id,
          name: room.name,
          room_type: getRoomType(room.beds),
          price_per_bed: 0, // Price per bed is now set at the room level, UI for which is a TODO
          capacity: room.beds,
        }).select().single();

        if (roomError) {
          // Consider deleting the property if room creation fails
          await supabase.from("properties").delete().eq("id", propertyData.id);
          throw new Error("Error creating room: " + roomError.message);
        }

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
          const { error: bedError } = await supabase.from("beds").insert(bedInserts);
          if (bedError) {
            // Clean up: delete property and rooms if bed creation fails
            await supabase.from("properties").delete().eq("id", propertyData.id);
            throw new Error("Error creating beds: " + bedError.message);
          }
        }
      }

      // Success!
      router.push("/dashboard?tab=properties");
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Failed to list your property");
      } else {
        setError("An unknown error occurred.");
      }
      console.error("Error in property submission:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['agent']}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">List a New Property</h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Follow the steps to get your property listed.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                <p>{error}</p>
              </div>
            )}

            {/* Stepper */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${step === 0 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>Property & Rooms</span>
                <span className={`text-sm ${step === 1 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>Media & Amenities</span>
                <span className={`text-sm ${step === 2 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>Availability & Contact</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(step / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold border-b pb-2">Step 1: Property Details & Room Configuration</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="E.g. Spacious 2 Bedroom Apartment in Westlands"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe your property in detail"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Property Type *
                      </label>
                      <select
                        id="propertyType"
                        name="propertyType"
                        required
                        value={formData.propertyType}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="hostel">Hostel</option>
                        <option value="bedsitter">Bedsitter</option>
                        <option value="single-room">Single Room</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Monthly Price (USD) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        required
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="E.g. 150"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bathrooms (Property-wide) *
                      </label>
                      <select
                        id="bathrooms"
                        name="bathrooms"
                        required
                        value={formData.bathrooms}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="1">1 bathroom</option>
                        <option value="2">2 bathrooms</option>
                        <option value="3">3 bathrooms</option>
                        <option value="4">4 bathrooms</option>
                        <option value="5">5+ bathrooms</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
                        <strong>Note:</strong> Bathrooms are shared facilities for the entire property, separate from individual room configurations.
                      </p>
                    </div>
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
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="E.g. 123 Waiyaki Way"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City/Town *
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="E.g. Nairobi"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        County
                      </label>
                      <input
                        type="text"
                        name="state"
                        id="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="E.g. Nairobi County"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="E.g. 00100"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              )}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Step 2: Media & Amenities</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Property Photos *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 border-2 border-dashed rounded-full flex items-center justify-center">
                  <span className="text-2xl">+</span>
                </div>
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload files</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>
            
            {/* Image preview */}
            {imagePreview.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uploaded images:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {imagePreview.map((src, index) => (
                    <div key={index} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={src} 
                        alt={`Preview ${index + 1}`} 
                        className="h-24 w-full object-cover rounded-md cursor-pointer touch-manipulation"
                        onClick={() => setFullViewImage(src)}
                        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                        style={{ WebkitTouchCallout: 'none' }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="wifi"
                    name="wifi"
                    type="checkbox"
                    checked={formData.amenities.wifi}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="wifi" className="font-medium text-gray-700 dark:text-gray-300">
                    WiFi Internet
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="power"
                    name="power"
                    type="checkbox"
                    checked={formData.amenities.power}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="power" className="font-medium text-gray-700 dark:text-gray-300">
                    Reliable Power
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="water"
                    name="water"
                    type="checkbox"
                    checked={formData.amenities.water}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="water" className="font-medium text-gray-700 dark:text-gray-300">
                    Reliable Water
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="parking"
                    name="parking"
                    type="checkbox"
                    checked={formData.amenities.parking}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="parking" className="font-medium text-gray-700 dark:text-gray-300">
                    Parking
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="tv"
                    name="tv"
                    type="checkbox"
                    checked={formData.amenities.tv}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="tv" className="font-medium text-gray-700 dark:text-gray-300">
                    TV
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="airConditioning"
                    name="airConditioning"
                    type="checkbox"
                    checked={formData.amenities.airConditioning}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="airConditioning" className="font-medium text-gray-700 dark:text-gray-300">
                    Air Conditioning
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="furnished"
                    name="furnished"
                    type="checkbox"
                    checked={formData.amenities.furnished}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="furnished" className="font-medium text-gray-700 dark:text-gray-300">
                    Furnished
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="laundry"
                    name="laundry"
                    type="checkbox"
                    checked={formData.amenities.laundry}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="laundry" className="font-medium text-gray-700 dark:text-gray-300">
                    Laundry
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="securitySystem"
                    name="securitySystem"
                    type="checkbox"
                    checked={formData.amenities.securitySystem}
                    onChange={handleCheckboxChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="securitySystem" className="font-medium text-gray-700 dark:text-gray-300">
                    Security System
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              ← Previous Step
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next Step →
            </button>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Step 3: Availability & Contact</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Available From
              </label>
              <input
                type="date"
                name="availableFrom"
                id="availableFrom"
                value={formData.availableFrom}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="availableTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Available To (Optional)
              </label>
              <input
                type="date"
                name="availableTo"
                id="availableTo"
                value={formData.availableTo}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                id="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="E.g. 0712345678"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Email (Optional)
              </label>
              <input
                type="email"
                name="contactEmail"
                id="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="E.g. you@example.com"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="rules" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              House Rules & Policies
            </label>
            <textarea
              name="rules"
              id="rules"
              value={formData.rules}
              onChange={handleChange}
              rows={4}
              placeholder="Specify any rules or policies for your property"
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              ← Previous Step
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Listing'}
            </button>
          </div>
        </div>
      )}
            </form>
          </div>
        </div>
      </div>
      {fullViewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 touch-manipulation"
          onClick={() => setFullViewImage(null)}
          style={{ WebkitTouchCallout: 'none' }}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <PropertyImage
              src={fullViewImage}
              alt="Full view"
              className="max-w-full max-h-[90vh] object-contain pointer-events-none"
              fallbackSrc="/file.svg"
            />
            <button
              onClick={() => setFullViewImage(null)}
              className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full p-2 touch-manipulation"
              style={{ WebkitTouchCallout: 'none' }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default PropertyForm;