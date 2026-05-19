import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Heart, MessageSquare, 
  PlusCircle, Home, Users, BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  type: 'tenant' | 'landlord';
}

export default function BottomNav({ type }: BottomNavProps) {
  const location = useLocation();

  const tenantMenu = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/tenant' },
    { icon: Heart, label: 'Saved', path: '/dashboard/tenant/saved' }, 
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/tenant/messages' }, 
  ];

  const landlordMenu = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/landlord' },
    { icon: Home, label: 'Properties', path: '/dashboard/landlord/properties' },
    { icon: PlusCircle, label: 'Add', path: '/dashboard/landlord/add' },
    { icon: MessageSquare, label: 'Enquiries', path: '/dashboard/landlord/messages' }, 
  ];

  const menu = type === 'tenant' ? tenantMenu : landlordMenu;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-primary/5 px-4 pt-3 pb-8 z-50 flex justify-around items-center">
      {menu.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              isActive ? "text-accent" : "text-primary/40"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-primary/30")} />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest",
              isActive ? "text-primary" : "text-primary/40"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
