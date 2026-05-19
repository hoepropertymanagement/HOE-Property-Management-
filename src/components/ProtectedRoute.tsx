import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireLandlord?: boolean;
}

export default function ProtectedRoute({ children, requireLandlord = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If role is missing, redirect to dashboard gateway for onboarding
  if (!profile?.role && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireLandlord && profile?.role !== 'landlord' && profile?.role !== 'both') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
