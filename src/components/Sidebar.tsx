import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Heart, MessageSquare, 
  Settings, LogOut,
  PlusCircle, Home, Users, BarChart3,
  ChevronLeft, ChevronRight, ArrowLeftRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('hoe_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.collapsed === 'boolean') {
        setIsCollapsed(customEvent.detail.collapsed);
      }
    };
    window.addEventListener('hoe-sidebar-toggle', handler);
    return () => window.removeEventListener('hoe-sidebar-toggle', handler);
  }, []);

  return isCollapsed;
}

interface SidebarProps {
  type: 'tenant' | 'landlord' | 'agent';
}

export default function Sidebar({ type }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('hoe_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const { logout, profile } = useAuth();

  const tenantMenu = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/tenant' },
    { icon: Heart, label: 'Saved Properties', path: '/dashboard/tenant/saved' }, 
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/tenant/messages' }, 
  ];

  const landlordMenu = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/landlord' },
    { icon: Home, label: 'My Properties', path: '/dashboard/landlord/properties' },
    { icon: PlusCircle, label: 'Add Property', path: '/dashboard/landlord/add' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/landlord/analytics' },
    { icon: MessageSquare, label: 'Enquiries', path: '/dashboard/landlord/messages' }, 
    { icon: Users, label: 'Tenants', path: '/dashboard/landlord/tenants' },
  ];

  const agentMenu = [
    { icon: LayoutDashboard, label: 'Dashboard Overview', path: '/dashboard/agent' },
    { icon: Users, label: 'My Landlords', path: '/dashboard/agent/landlords' },
    { icon: Home, label: 'Managed Properties', path: '/dashboard/agent/properties' },
  ];

  let menu = tenantMenu;
  if (type === 'landlord') {
    menu = landlordMenu;
  } else if (type === 'agent') {
    menu = agentMenu;
  }

  return (
    <>
      {/* Mobile/Tablet Overlay when sidebar is open in some future mobile-drawer version, 
          but for now we use BottomNav for mobile and Sidebar for Tablet/Desktop */}
      
      <aside 
        className={cn(
          "fixed left-0 top-20 bottom-0 bg-white border-r border-primary/5 hidden md:flex flex-col z-[30] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isCollapsed ? "w-24" : "w-72"
        )}
      >
        {/* Collapse Toggle - Tablet/Desktop Only */}
        <button 
          onClick={() => {
            const nextState = !isCollapsed;
            setIsCollapsed(nextState);
            try {
              localStorage.setItem('hoe_sidebar_collapsed', String(nextState));
            } catch {}
            window.dispatchEvent(new CustomEvent('hoe-sidebar-toggle', { detail: { collapsed: nextState } }));
          }}
          className="absolute -right-3 top-10 w-6 h-6 bg-primary text-accent rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform z-50 border border-accent/20"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className={cn(
          "flex-grow overflow-y-auto overflow-x-hidden pt-8 custom-scrollbar",
          isCollapsed ? "px-4" : "p-8"
        )}>
          {profile?.role === 'both' && (
            <div className="mb-6 px-4">
              <Link
                to={type === 'tenant' ? '/dashboard/landlord' : '/dashboard/tenant'}
                title={isCollapsed ? (type === 'tenant' ? 'Switch to Landlord Portal' : 'Switch to Tenant Portal') : ""}
                className="flex items-center gap-4 py-3 bg-accent/10 border border-accent/30 rounded-2xl hover:bg-accent hover:border-accent hover:text-primary group transition-all duration-300 shadow-sm justify-center"
              >
                <ArrowLeftRight className="w-5 h-5 text-accent group-hover:text-primary transition-colors flex-shrink-0" />
                <span className={cn(
                  "whitespace-nowrap transition-all duration-300 text-xs font-bold uppercase tracking-widest text-accent group-hover:text-primary",
                  isCollapsed ? "opacity-0 w-0 pointer-events-none" : "opacity-100 w-auto"
                )}>
                  {type === 'tenant' ? 'Switch to Landlord' : 'Switch to Tenant'}
                </span>
              </Link>
            </div>
          )}

          <div className={cn(
            "mb-10 px-4 transition-opacity duration-300",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/40 mb-2">Main Navigation</p>
          </div>
          
          <nav className="space-y-4">
            {menu.map((item) => {
              const isActive = location.pathname === item.path;
              const uniqueKey = `${item.path}-${item.label}`;
              return (
                <Link
                  key={uniqueKey}
                  to={item.path}
                  title={isCollapsed ? item.label : ""}
                  className={cn(
                    "flex items-center gap-4 py-3 text-sm transition-all relative group rounded-2xl",
                    isCollapsed ? "px-0 justify-center" : "px-4",
                    isActive ? "text-primary font-bold bg-secondary" : "text-primary/40 hover:text-primary font-medium hover:bg-secondary/50"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0", 
                    isActive ? "text-accent" : "text-primary/30 group-hover:text-accent transition-colors"
                  )} />
                  <span className={cn(
                    "relative whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                  )}>
                    {item.label}
                    {isActive && (
                      <motion.div 
                        layoutId="active-underline"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                      />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={cn(
          "p-8 border-t border-primary/5 space-y-4",
          isCollapsed && "px-4"
        )}>
          <Link 
            to="/settings" 
            title={isCollapsed ? "General Settings" : ""}
            className={cn(
              "flex items-center gap-4 py-3 w-full text-sm font-medium text-primary/40 hover:text-primary transition-all rounded-2xl hover:bg-secondary/50 group",
              isCollapsed ? "px-0 justify-center" : "px-4"
            )}
          >
            <Settings className="w-5 h-5 text-primary/30 group-hover:text-accent transition-colors flex-shrink-0" />
            {!isCollapsed && <span>General Settings</span>}
          </Link>
          <button 
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Log Out" : ""}
            className={cn(
              "flex items-center gap-4 py-3 w-full text-sm font-medium text-red-500/60 hover:text-red-500 transition-all rounded-2xl hover:bg-red-50 group",
              isCollapsed ? "px-0 justify-center" : "px-4"
            )}
          >
            <LogOut className="w-5 h-5 transition-colors flex-shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
        }}
      />
    </>
  );
}
