import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireLandlord?: boolean;
  requireTenant?: boolean;
  requireAgent?: boolean;
}

const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twighlightani113@gmail.com', 'twiglightani113@gmail.com', 'nkeface14@gmail.com'];

export default function ProtectedRoute({ children, requireLandlord = false, requireTenant = false, requireAgent = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
return <>{children}</>;
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

  const userEmail = user?.email || profile?.email || '';
  const isAgentUser = (userEmail && allowedAgentEmails.includes(userEmail.toLowerCase())) || profile?.role === 'agent';

  if (requireAgent) {
    if (!isAgentUser) {
      return <Navigate to="/dashboard" replace />;
    }
    // If it's an agent route and they are an agent, bypass the role check
  } else {
    // If we are NOT on an agent route, but they are an agent, let them through if their role is still null?
    // Actually, DashboardGateway auto-redirects them to agent dashboard anyway.
    if (!profile?.role && location.pathname !== '/dashboard' && !isAgentUser) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requireLandlord && profile?.role !== 'landlord' && profile?.role !== 'both' && !isAgentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireTenant && profile?.role !== 'tenant' && profile?.role !== 'both' && !isAgentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
