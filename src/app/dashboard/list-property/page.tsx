import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const PropertyForm = () => {
  const [formData, setFormData] = useState({
    address: "",
    price: "",
    title: "",
    photos: [] as File[],
    amenities: {
      wifi: false,
      pool: false,
      parking: false,
      power: false,
      water: false,
    },
    rules: "",
  });
  const [step, setStep] = useState(0);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      setFormData((prev) => ({ ...prev, photos: Array.from(files) }));
    }
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to list a property.");
      router.push("/auth/login");
      return;
    }

    // 1. Upload images to Supabase Storage
    const photoUrls = [];
    for (const photo of formData.photos) {
      const filePath = `${user.id}/${Date.now()}_${photo.name}`;
      const { data, error } = await supabase.storage
        .from("property-images")
        .upload(filePath, photo);

      if (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(data.path)
      photoUrls.push(publicUrl);
    }

    // 2. Insert into 'pads' table
    const { data: padData, error: padError } = await supabase
      .from("pads")
      .insert({
        created_by: user.id,
        title: formData.title,
        location: formData.address,
        image_url: photoUrls[0] || null, // Using the first image as the main one
        has_internet: formData.amenities.wifi,
        has_power: formData.amenities.power,
        has_water: formData.amenities.water,
      })
      .select()
      .single();

    if (padError) {
      console.error("Error creating property:", padError);
      alert("Failed to list your property. Please check the details and try again.");
      return;
    }

    // 3. For simplicity, we'll create one 'single' room for the pad.
    // A more complex implementation could allow adding multiple rooms.
    const { error: roomError } = await supabase.from("rooms").insert({
      pad_id: padData.id,
      name: "Main Space",
      type: "single",
      price: parseFloat(formData.price),
      capacity: 1,
    });

    if (roomError) {
      console.error("Error creating room:", roomError);
      // Here you might want to delete the pad that was just created for consistency
      alert("Property listed, but failed to create a room for it.");
      return;
    }

    alert("Property listed successfully!");
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Step 1: Property Details</h2>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Property Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price per night
            </label>
            <input
              type="number"
              name="price"
              id="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Photos
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              multiple
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="wifi"
                    name="wifi"
                    type="checkbox"
                    checked={formData.amenities.wifi}
                    onChange={handleCheckboxChange}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="wifi" className="font-medium text-gray-700">
                    WiFi
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
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="power" className="font-medium text-gray-700">
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
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="water" className="font-medium text-gray-700">
                    Reliable Water
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Step 2: Rules and Policies</h2>
          <div className="mb-4">
            <label htmlFor="rules" className="block text-sm font-medium text-gray-700">
              House Rules
            </label>
            <textarea
              name="rules"
              id="rules"
              value={formData.rules}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows={4}
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Listing
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default PropertyForm;