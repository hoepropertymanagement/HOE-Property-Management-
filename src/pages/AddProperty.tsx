import React, { useState } from 'react';

export default function AddProperty() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="w-full min-h-screen bg-gray-50 pt-36 pb-20 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-6">Add New Property Listing</h1>

        {submitted ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-6">
            Property listing created successfully! (Preview Mode)
          </div>
        ) : null}

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
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            Publish Property
          </button>
        </form>
      </div>
    </main>
  );
}