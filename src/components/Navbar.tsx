import { Link, useLocation } from 'react-router-dom';
import { Search, User, Menu, X, LogOut, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const isSearchPage = location.pathname === '/search';

  const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twighlightani113@gmail.com', 'twiglightani113@gmail.com', 'nkeface14@gmail.com'];
  const isAgent = profile?.role === 'agent' || (user?.email && allowedAgentEmails.includes(user.email.toLowerCase()));

  useEffect(() => {
    const handleScroll = () => {
      // Trigger minimization much later, or follow a smoother logic
      // User requested: "only minimise when user is scrolling down to the bottom of the page"
      // We'll use a threshold but keep it very smooth
      const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
      const shouldMinimize = window.scrollY > 400 || isBottom;
      setIsMinimized(shouldMinimize);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');

  const isHomeActive = location.pathname === '/';
  const isRentActive = location.pathname === '/search' && (mode === 'Rent' || !mode);
  const isValuationActive = location.pathname.startsWith('/landlord');
  const isDashboardActive = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/tenant') || location.pathname.startsWith('/landlord');

  const getLinkClass = (isActive: boolean) => 
    cn(
      "transition-all duration-300 pb-1 md:text-[10px] lg:text-xs uppercase tracking-[0.2em]",
      isActive 
        ? "text-primary border-b-2 border-accent font-bold" 
        : "text-primary/60 hover:text-primary border-b-2 border-transparent font-medium"
    );

  const getMobileLinkClass = (isActive: boolean) => 
    cn(
      "block text-xs uppercase tracking-[0.3em] font-black transition-all duration-300 pb-2 w-fit",
      isActive 
        ? "text-primary border-b border-accent" 
        : "text-primary/30 hover:text-accent border-b border-transparent"
    );

  return (
    <nav className={cn(
      "bg-secondary sticky top-0 z-[2000] border-b border-primary/5 transition-all duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu",
      isMinimized ? "h-16 shadow-lg shadow-primary/5" : "h-20"
    )}>
      <div className={cn(
        "max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-full transition-all duration-300"
      )}>
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link to="/" className={cn(
              "flex items-center gap-3 group transition-all duration-300",
              isMinimized ? "scale-90" : "scale-100"
            )}>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-accent font-serif text-xl md:text-2xl font-bold">H</span>
              </div>
              <div className={cn(
                "flex flex-col transition-all duration-300",
                isMinimized && "hidden md:flex"
              )}>
                <span className="text-sm md:text-lg font-serif font-bold uppercase tracking-tight text-primary leading-none">
                  HOE PROPERTY MANAGEMENT
                </span>
                <span className="text-[8px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-accent uppercase leading-none mt-1">
                  HOUSE OF EDEN
                </span>
              </div>
            </Link>
          </div>

          <div className={cn(
            "hidden md:flex items-center space-x-8 uppercase tracking-widest md:text-[9px] lg:text-[11px] font-bold transition-all duration-300",
            isMinimized && isSearchPage ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <Link to="/" className={getLinkClass(isHomeActive)}>Search</Link>
            <Link to="/search?mode=Rent" className={getLinkClass(isRentActive)}>Lettings/Buy</Link>
            <Link to="/contact" className={getLinkClass(location.pathname === '/contact')}>Contact</Link>
            <Link to={isAgent ? "/dashboard/agent" : "/dashboard"} className={getLinkClass(isDashboardActive)}>Dashboard</Link>
          </div>

          <div className={cn(
            "hidden md:flex items-center space-x-6 transition-all duration-300",
            isMinimized && isSearchPage ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            {user ? (
              <div className="flex items-center gap-6">
                <Link to="/dashboard/tenant/messages" className="text-primary/60 hover:text-accent transition-colors relative">
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full border-2 border-secondary" />
                </Link>
                <div className="flex items-center gap-4 border-l border-primary/10 pl-6">
                  <Link to="/profile" className="flex items-center gap-3 group animate-fadeIn">
                    <div className={cn(
                      "w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all",
                      isAgent 
                        ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0d140e] shadow-[0_0_12px_rgba(59,130,246,0.65)] bg-slate-800" 
                        : "bg-accent/20 border border-accent/20"
                    )}>
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-accent font-bold text-xs">
                          {profile?.name?.[0] || user.email?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary group-hover:text-accent transition-colors">
                      {profile?.name?.split(' ')[0] || 'Profile'}
                    </span>
                  </Link>
                  <button 
                    onClick={() => setShowLogoutModal(true)}
                    className="p-2 text-primary/40 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  className="md:text-[9px] lg:text-[11px] font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/auth" 
                  className="px-6 py-2 bg-primary text-secondary md:text-[9px] lg:text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/95 transition-all shadow-lg shadow-primary/10"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button & Quick Profile/Auth */}
          <div className="md:hidden flex items-center gap-3">
            {!user ? (
              <Link 
                to="/auth" 
                className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 hover:text-accent transition-colors"
              >
                Log In
              </Link>
            ) : (
              <Link 
                to="/profile" 
                className={cn(
                  "w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center transition-all active:scale-90 shadow-sm",
                  isAgent 
                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0d140e] shadow-[0_0_12px_rgba(59,130,246,0.65)] bg-slate-800" 
                    : "bg-accent/20 border border-accent/20"
                )}
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-accent font-bold text-xs">
                    {profile?.name?.[0] || user.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isOpen ? "bg-primary text-accent" : "bg-primary/5 text-primary active:bg-primary/10"
              )}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-primary/20 z-[2100] md:hidden"
            />
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 top-0 bg-white shadow-2xl z-[2200] md:hidden flex flex-col border-b border-primary/5"
            >
              {/* Menu Header with Close Button */}
              <div className="flex justify-between items-center px-6 h-20 border-b border-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <span className="text-accent font-serif text-xl font-bold">H</span>
                  </div>
                  <span className="text-sm font-serif font-bold uppercase tracking-tight text-primary">HOE PROPERTY MANAGEMENT</span>
                  <span className="text-[8px] font-sans font-bold tracking-widest text-accent uppercase block">HOUSE OF EDEN</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 flex flex-col gap-6">
                <div className="space-y-4">
                  <Link to="/" className={getMobileLinkClass(isHomeActive)} onClick={() => setIsOpen(false)}>Home</Link>
                  <Link to="/search?mode=Rent" className={getMobileLinkClass(isRentActive)} onClick={() => setIsOpen(false)}>Lettings/Buy</Link>
                  <Link to="/contact" className={getMobileLinkClass(location.pathname === '/contact')} onClick={() => setIsOpen(false)}>Contact</Link>
                  <Link to={isAgent ? "/dashboard/agent" : "/dashboard"} className={getMobileLinkClass(isDashboardActive)} onClick={() => setIsOpen(false)}>Dashboard</Link>
                  {user && (
                    <Link to="/settings" className={getMobileLinkClass(location.pathname === '/settings')} onClick={() => setIsOpen(false)}>Settings</Link>
                  )}
                </div>

                <div className="pt-6 border-t border-primary/5 flex flex-col gap-4">
                  {user ? (
                    <div className="grid grid-cols-3 gap-2">
                      <Link 
                        to="/profile" 
                        className="py-3 bg-primary text-secondary text-center rounded-lg font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center cursor-pointer hover:bg-primary/95 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link 
                        to="/settings" 
                        className="py-3 bg-secondary text-primary border border-primary/10 text-center rounded-lg font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        Settings
                      </Link>
                      <button 
                        onClick={() => { setShowLogoutModal(true); setIsOpen(false); }}
                        className="py-3 bg-red-50 text-red-600 hover:bg-red-100/80 text-center rounded-lg font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center cursor-pointer transition-all border border-red-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to="/auth" 
                      className="w-full py-3 bg-[#0a2f1d] text-[#D4AF37] text-center rounded-lg font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center cursor-pointer hover:bg-primary/95 transition-all border border-[#D4AF37]/30 shadow-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Login/Sign up
                    </Link>
                  )}
                  <p className="text-center text-[7px] text-primary/30 uppercase tracking-[0.3em] font-medium">House of Eden Property Management</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
        }}
      />
    </nav>
  );
}
