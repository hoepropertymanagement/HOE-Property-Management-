import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // Adjust path if your supabase client is located elsewhere

export default function AddProperty() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let publicImageUrl = '';

      // 1. Upload image to Supabase Storage (if selected)
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `property-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('properties') // Make sure a bucket named 'properties' exists in Supabase Storage
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw new Error(`Image Upload Error: ${uploadError.message}`);
        }

        // Get public URL of uploaded image
        const { data: urlData } = supabase.storage
          .from('properties')
          .getPublicUrl(filePath);

        publicImageUrl = urlData.publicUrl;
      }

      // 2. Insert record into Supabase Database
      const { error: insertError } = await supabase
        .from('properties') // Make sure 'properties' table exists in Supabase
        .insert([
          {
            title,
            price: Number(price),
            location,
            image_url: publicImageUrl || imagePreview,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        throw new Error(`Database Error: ${insertError.message}`);
      }

      setSuccessMessage('Property listing published successfully to the database!');
      
      // Reset form fields
      setTitle('');
      setPrice('');
      setLocation('');
      setSelectedFile(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-gray-50 pt-36 pb-20 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-6">Add New Property Listing</h1>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-6 border border-green-200">
            {successMessage}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl mb-6 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Modern 2-Bedroom Apartment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (£ / month)</label>
              <input
                type="number"
                required
                placeholder="1200"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                required
                placeholder="City / Area"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Property Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
              <img
                src={imagePreview}
                alt="Upload Preview"
                className="w-full h-64 object-cover rounded-xl border border-gray-200"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish Property'}
          </button>
        </form>
      </div>
    </main>
  );
}