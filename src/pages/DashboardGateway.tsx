import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const reselect = searchParams.get('reselect') === 'true';

  useEffect(() => {
    if (!loading && profile && !reselect) {
      if (profile.role === 'tenant') {
        navigate('/tenant-dashboard', { replace: true });
      } else if (profile.role === 'landlord') {
        navigate('/landlord-dashboard', { replace: true });
      } else if (profile.role === 'agent') {
        navigate('/agent-dashboard', { replace: true });
      }
    }
  }, [profile, loading, navigate, reselect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}