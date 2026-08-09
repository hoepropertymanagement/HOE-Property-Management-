/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twilightani113@gmail.com'];
  const isAgent = profile?.role === 'agent' || (user?.email && allowedAgentEmails.includes(user.email));

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');

  const isHomeActive = location.pathname === '/home';
  const isAuthActive = location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/login';
  const isRentActive = location.pathname === '/search' && mode === 'Rent';
  const isContactActive = location.pathname === '/contact';
  const isDashboardActive = location.pathname.startsWith('/landlord') || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/tenant');

  const getLinkClass = (isActive: boolean) => `
    transition-all duration-300 pb-1 md:text-[10px] lg:text-xs uppercase tracking-[0.2em]
    ${isActive
      ? "text-primary border-b-2 border-accent font-bold"
      : "text-primary/60 hover:text-primary border-b-2 border-transparent font-medium"
    }
  `;

  return (
    <>
      <nav className={cn(
        "bg-secondary sticky top-0 z-[2000] border-b border-primary/5 transition-all duration-1000 ease-in-out",
        isMinimized ? "h-16 shadow-lg shadow-primary/5" : "h-20"
      )}>
        <div className={cn(
          "max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-full transition-all duration-300",
          "flex justify-between items-center h-full"
        )}>
          <div className="flex items-center gap-6">
            {/* Logo directs to /home if logged in, otherwise /auth */}
            <Link to={user ? "/home" : "/auth"} className={cn(
              "flex items-center gap-3 group transition-all duration-300",
              isMinimized ? "scale-90" : "scale-100"
            )}>
              <img src="/images/logo.png" alt="HOE Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <div className={cn(
                "flex flex-col transition-all duration-300",
                isMinimized && "hidden md:flex"
              )}>
                <span className="text-sm md:text-lg font-serif font-bold uppercase tracking-tight text-primary">
                  HOE PROPERTY MANAGEMENT
                </span>
                <span className="text-[8px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-accent">
                  HOUSE OF EDEN
                </span>
              </div>
            </Link>

            <div className={cn(
              "hidden md:flex items-center space-x-8 uppercase tracking-widest md:text-[9px] lg:text-[11px]"
            )}>
              {/* Show SIGN IN / SIGN UP only when user is NOT logged in */}
              {!user && (
                <Link to="/auth" className={getLinkClass(isAuthActive)}>Sign In / Sign Up</Link>
              )}

              {/* SEARCH link ALWAYS points to /home (Hero Property Filter page) */}
              <Link to="/home" className={getLinkClass(isHomeActive)}>Search</Link>
              
              <Link to="/search?mode=Rent" className={getLinkClass(isRentActive)}>Lettings/Buy</Link>
              <Link to="/contact" className={getLinkClass(isContactActive)}>Contact</Link>
              
              {/* Dashboard link */}
              <Link to={isAgent ? "/dashboard/agent" : "/dashboard"} className={getLinkClass(isDashboardActive)}>Dashboard</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-3 group">
                  <div className={cn(
                    "w-8 h-8 rounded-full overflow-hidden flex items-center justify-center",
                    isAgent ? "ring-2 ring-blue-500 ring-offset-2" : "bg-accent/20 border border-accent/20"
                  )}>
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt={profile.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                        {(profile?.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="p-2 text-primary/60 hover:text-primary transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-primary hover:text-accent transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="md:hidden bg-secondary border-b border-primary/10 px-4 pt-2 pb-6 space-y-3">
            {!user && (
              <Link to="/auth" onClick={() => setIsOpen(false)} className="block py-2 text-xs uppercase font-bold text-primary">Sign In / Sign Up</Link>
            )}
            <Link to="/home" onClick={() => setIsOpen(false)} className="block py-2 text-xs uppercase font-bold text-primary">Search</Link>
            <Link to="/search?mode=Rent" onClick={() => setIsOpen(false)} className="block py-2 text-xs uppercase font-bold text-primary">Lettings/Buy</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} className="block py-2 text-xs uppercase font-bold text-primary">Contact</Link>
            <Link to={isAgent ? "/dashboard/agent" : "/dashboard"} onClick={() => setIsOpen(false)} className="block py-2 text-xs uppercase font-bold text-primary">Dashboard</Link>
          </div>
        )}
      </nav>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
      />
    </>
  );
}