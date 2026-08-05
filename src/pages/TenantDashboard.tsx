import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function TenantDashboard() {
  const { user, profile } = useAuth() as any;

  return (
    <main className="w-full min-h-screen bg-gray-50 pt-36 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Tenant Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, <span className="font-semibold text-gray-900">{profile?.full_name || user?.email || 'Valued Tenant'}</span>!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Saved Properties</h2>
            <p className="text-4xl font-black text-indigo-600 mt-2">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Applications</h2>
            <p className="text-4xl font-black text-indigo-600 mt-2">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Messages</h2>
            <p className="text-4xl font-black text-indigo-600 mt-2">0</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="flex gap-4">
            <Link to="/search" className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition">
              Explore Properties
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}