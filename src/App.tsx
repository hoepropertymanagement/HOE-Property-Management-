/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense, ReactNode, ErrorInfo, Component } from 'react';
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
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import SavedPropertiesPage from './pages/SavedPropertiesPage';
import ProtectedRoute from './components/ProtectedRoute';
import { SavedPropertiesProvider } from './context/SavedPropertiesContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { useEffect } from 'react';

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

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <NotificationProvider>
        <RedirectListener />
        <AuthProvider>
          <SavedPropertiesProvider>
            <div className="min-h-screen flex flex-col font-sans">
              <Navbar />
              <main className="flex-grow">
                <ErrorBoundary>
                  <Suspense fallback={<div className="min-h-screen bg-secondary flex items-center justify-center">Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/search" element={<SearchResults />} />
                      <Route path="/property/:id" element={<PropertyDetail />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/help" element={<HelpFAQ />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/terms" element={<TermsAndConditions />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/cookies" element={<CookiePolicy />} />
                      <Route path="/compliance" element={<Compliance />} />
                      
                      {/* Dashboard Routes */}
                      <Route path="/dashboard" element={<ProtectedRoute><DashboardGateway /></ProtectedRoute>} />
                      
                      {/* Landlord Routes */}
                      <Route path="/dashboard/landlord" element={<ProtectedRoute requireLandlord><LandlordDashboard /></ProtectedRoute>} />
                      <Route path="/dashboard/landlord/properties" element={<ProtectedRoute requireLandlord><ManageProperties /></ProtectedRoute>} />
                      <Route path="/dashboard/landlord/add" element={<ProtectedRoute requireLandlord><AddProperty /></ProtectedRoute>} />
                      <Route path="/dashboard/landlord/analytics" element={<ProtectedRoute requireLandlord><Valuation /></ProtectedRoute>} />
                      <Route path="/dashboard/landlord/messages" element={<ProtectedRoute requireLandlord><Messages type="landlord" /></ProtectedRoute>} />
                      <Route path="/dashboard/landlord/tenants" element={<ProtectedRoute requireLandlord><ManageTenants /></ProtectedRoute>} />
                      
                      {/* Tenant Routes */}
                      <Route path="/dashboard/tenant" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
                      <Route path="/dashboard/tenant/saved" element={<ProtectedRoute><SavedPropertiesPage /></ProtectedRoute>} />
                      <Route path="/dashboard/tenant/messages" element={<ProtectedRoute><Messages type="tenant" /></ProtectedRoute>} />
                      
                      {/* Agent Routes */}
                      <Route path="/dashboard/agent" element={<ProtectedRoute><AgentDashboard tab="overview" /></ProtectedRoute>} />
                      <Route path="/dashboard/agent/landlords" element={<ProtectedRoute><AgentDashboard tab="landlords" /></ProtectedRoute>} />
                      <Route path="/dashboard/agent/properties" element={<ProtectedRoute><AgentDashboard tab="properties" /></ProtectedRoute>} />
                      
                      {/* Fallbacks */}
                      <Route path="/tenant/*" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
                      <Route path="/landlord/*" element={<ProtectedRoute requireLandlord><LandlordDashboard /></ProtectedRoute>} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </main>
              <Footer />
              <CookieConsent />
            </div>
          </SavedPropertiesProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}
