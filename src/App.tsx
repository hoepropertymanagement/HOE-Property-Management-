/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import React, { Suspense, useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import PropertyDetail from './pages/PropertyDetail';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AddProperty from './pages/AddProperty';
import ManageProperties from './pages/ManageProperties';
import Valuation from './pages/Valuation';
import Messages from './pages/Messages';
import ManageTenants from './pages/ManageTenants';
import DashboardGateway from './pages/DashboardGateway';
import AuthPage from './pages/AuthPage';
import Settings from './pages/Settings';
import AboutUs from './pages/AboutUs';
import HelpFAQ from './pages/HelpFAQ';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Compliance from './pages/Compliance';
import Contact from './pages/Contact';
import ProfilePage from './pages/ProfilePage';
import Fees from './pages/Fees';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import SavedPropertiesPage from './pages/SavedPropertiesPage';
import ProtectedRoute from './components/ProtectedRoute';
import { SavedPropertiesProvider } from './context/SavedPropertiesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { supabase } from './lib/supabase';

function AuthDebug() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[supabase auth]", { event, hasSession: !!session });
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}

// Catches OAuth callbacks (e.g. Google Sign-In) and immediately redirects to the target dashboard
function OAuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const role = session.user?.user_metadata?.role || 'tenant';
        navigate(`/dashboard/${role}`, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

function RedirectListener() {
  const { showNotification } = useNotification();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'verified') {
      showNotification("email verified successfully", "gold");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error') {
      showNotification("verification error", "red");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showNotification]);

  return null;
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-white p-8 text-center">
          <h1 className="text-4xl font-serif mb-4 italic">Something went wrong</h1>
          <p className="text-accent uppercase tracking-widest text-xs mb-8">We encountered an unexpected error while loading this page.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-accent text-primary font-bold uppercase tracking-widest rounded-full hover:bg-accent-hover transition-all"
          >
            Return Home
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

function ImpersonationBanner() {
  const [landlordName, setLandlordName] = useState<string | null>(null);

  useEffect(() => {
    const checkImp = () => {
      setLandlordName(localStorage.getItem('impersonated_landlord_name'));
    };
    checkImp();
    const interval = setInterval(checkImp, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!landlordName) return null;

  const handleExit = () => {
    localStorage.removeItem('impersonated_landlord_id');
    localStorage.removeItem('impersonated_landlord_name');
    localStorage.removeItem('impersonated_landlord_email');
    localStorage.removeItem('impersonated_landlord_phone');
    window.location.href = '/dashboard/agent?tab=landlords';
  };

  return (
    <div className="bg-teal-50 border-b border-teal-200 py-3 px-6 flex flex-col sm:flex-row items-center justify-between text-teal-900 text-xs font-semibold z-50 sticky top-20 gap-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
        </span>
        <span className="font-black uppercase tracking-[0.15em] text-[8px] sm:text-[9px] bg-teal-600 text-white px-2 py-0.5 rounded leading-none">
          Agent Impersonation Active
        </span>
        <span>
          Viewing or controlling the portfolio of <strong>{landlordName}</strong> as a managing agent.
        </span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:shadow-md"
      >
        <LogOut className="w-3 h-3" /> Return to Agent Portal
      </button>
    </div>
  );
}

function MainLayout() {
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const isAuthPage = location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/login';

  // Determine role destination
  const targetRole = profile?.role || user?.user_metadata?.role || 'tenant';
  const dashboardPath = `/dashboard/${targetRole}`;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <ImpersonationBanner />}
      
      <main className="flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen bg-secondary flex items-center justify-center">Loading...</div>}>
            <Routes>
              {/* Redirect authenticated users away from Auth routes */}
              <Route 
                path="/" 
                element={user && !loading ? <Navigate to={dashboardPath} replace /> : <AuthPage />} 
              />
              <Route 
                path="/auth" 
                element={user && !loading ? <Navigate to={dashboardPath} replace /> : <AuthPage />} 
              />
              <Route 
                path="/login" 
                element={user && !loading ? <Navigate to={dashboardPath} replace /> : <AuthPage />} 
              />

              <Route path="/home" element={<Home />} />
              <Route path="/add-property" element={<AddProperty />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/help" element={<HelpFAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/fees" element={<Fees />} />
              
              {/* Dashboard Gateway */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardGateway /></ProtectedRoute>} />
              
              {/* Landlord Routes */}
              <Route path="/dashboard/landlord" element={<ProtectedRoute requireLandlord><LandlordDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/landlord/properties" element={<ProtectedRoute requireLandlord><ManageProperties /></ProtectedRoute>} />
              <Route path="/dashboard/landlord/add" element={<ProtectedRoute requireLandlord><AddProperty /></ProtectedRoute>} />
              <Route path="/dashboard/landlord/analytics" element={<ProtectedRoute requireLandlord><Valuation /></ProtectedRoute>} />
              <Route path="/dashboard/landlord/messages" element={<ProtectedRoute requireLandlord><Messages type="landlord" /></ProtectedRoute>} />
              <Route path="/dashboard/landlord/tenants" element={<ProtectedRoute requireLandlord><ManageTenants /></ProtectedRoute>} />
              
              {/* Tenant Routes */}
              <Route path="/dashboard/tenant" element={<ProtectedRoute requireTenant><TenantDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/tenant/saved" element={<ProtectedRoute requireTenant><SavedPropertiesPage /></ProtectedRoute>} />
              <Route path="/dashboard/tenant/messages" element={<ProtectedRoute requireTenant><Messages type="tenant" /></ProtectedRoute>} />
              
              {/* Agent Routes */}
              <Route path="/dashboard/agent" element={<ProtectedRoute requireAgent><AgentDashboard tab="overview" /></ProtectedRoute>} />
              <Route path="/dashboard/agent/landlords" element={<ProtectedRoute requireAgent><AgentDashboard tab="landlords" /></ProtectedRoute>} />
              <Route path="/dashboard/agent/properties" element={<ProtectedRoute requireAgent><AgentDashboard tab="properties" /></ProtectedRoute>} />
              <Route path="/dashboard/agent/messages" element={<ProtectedRoute requireAgent><Messages type="agent" /></ProtectedRoute>} />
              
              {/* Fallbacks */}
              <Route path="/tenant/*" element={<ProtectedRoute requireTenant><TenantDashboard /></ProtectedRoute>} />
              <Route path="/landlord/*" element={<ProtectedRoute requireLandlord><LandlordDashboard /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {!isAuthPage && <Footer />}
      {!isAuthPage && <CookieConsent />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthDebug />
      <OAuthRedirectHandler />
      <ScrollToTop />
      <NotificationProvider>
        <RedirectListener />
        <AuthProvider>
          <SavedPropertiesProvider>
            <MainLayout />
          </SavedPropertiesProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}