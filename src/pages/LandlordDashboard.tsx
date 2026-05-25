/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  Users, Home, MessageSquare, TrendingUp, 
  Plus, ChevronRight, BarChart3, ArrowUpRight,
  ArrowLeft, LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function LandlordDashboard() {
  const isCollapsed = useSidebarCollapse();
  const { profile } = useAuth();

  return (
    <div className="bg-secondary min-h-screen">
      <Sidebar type="landlord" />
      
      <div className={cn(
        "pt-10 pb-32 px-4 sm:px-6 lg:px-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-6 mb-8">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-accent transition-colors w-fit"
            >
              <ArrowLeft className="w-3 h-3" /> Exit to Home
            </Link>
            {profile?.role === 'both' && (
              <>
                <div className="w-px h-3 bg-primary/20" />
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors w-fit"
                >
                  <LayoutDashboard className="w-3 h-3" /> Back to Portal Choice
                </Link>
              </>
            )}
          </div>

          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-serif italic text-accent mb-2">Portfolio Overview</h1>
              <p className="text-primary/50 text-sm">Welcome back. System initialized and ready for deployment.</p>
            </div>
            <div className="flex gap-4">
              <Link 
                to="/dashboard/landlord/add"
                className="bg-primary text-secondary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-accent hover:text-primary transition-all shadow-xl shadow-primary/20 text-[11px] uppercase tracking-widest"
              >
                <Plus className="w-5 h-5 text-accent" />
                Add New Property
              </Link>
            </div>
          </header>

          {/* Promotional Bold Statements */}
          <div className="mb-12 bg-primary p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-around items-center gap-6 shadow-2xl">
            <p className="text-accent text-xl md:text-2xl font-bold uppercase tracking-widest text-center">
              Landlords can list for free
            </p>
            <div className="hidden md:block w-px h-12 bg-accent/20" />
            <div className="flex flex-col items-center gap-1">
              <p className="text-accent text-xl md:text-2xl font-bold uppercase tracking-widest text-center">
                No guarantor scheme*
              </p>
              <p className="text-accent/60 text-[10px] font-medium uppercase tracking-widest text-center">
                Insurance policy applied
              </p>
            </div>
          </div>
 
          {/* Core Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Manage properties', desc: '0 active listings', icon: Home, path: '/dashboard/landlord/properties' },
              { label: 'Market Analytics', desc: 'No data available', icon: BarChart3, path: '/dashboard/landlord/analytics' },
              { label: 'Enquiry Inbox', desc: 'No new messages', icon: MessageSquare, path: '/dashboard/landlord' }
            ].map((action, i) => (
              <Link
                key={i}
                to={action.path}
                className="bg-white p-8 rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-accent transition-all relative z-10">
                  <action.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif italic text-primary relative z-10">{action.label}</h3>
                <p className="text-[10px] text-primary/40 uppercase font-bold tracking-widest mt-1 relative z-10">{action.desc}</p>
                <ChevronRight className="absolute right-8 bottom-8 w-6 h-6 text-primary/10 group-hover:text-accent transition-all transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Enquiries Section */}
            <div className="lg:col-span-2 bg-primary p-10 rounded-[3rem] text-secondary">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-serif italic mb-2">Recent Enquiries</h3>
              </div>
              <div className="py-20 text-center flex flex-col items-center justify-center bg-white/5 rounded-[2.5rem] border border-white/5">
                <MessageSquare className="w-16 h-16 text-secondary/10 mb-6" />
                <p className="text-sm italic text-secondary/40">No enquiries yet. They will appear here when tenants contact you.</p>
              </div>
            </div>
 
            {/* Performance Summary */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-xl shadow-primary/5">
                <TrendingUp className="w-10 h-10 text-accent mb-6" />
                <h3 className="text-xl font-serif italic text-primary mb-2">Portfolio Yield</h3>
                <p className="text-4xl font-serif italic text-primary mb-6">0.0%</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary/40 font-medium font-bold uppercase tracking-widest text-[9px]">Monthly Revenue</span>
                    <span className="font-bold text-primary italic">£0</span>
                  </div>
                  <div className="w-full h-1 bg-secondary rounded-full">
                    <div className="w-0 h-full bg-accent rounded-full" />
                  </div>
                </div>
              </div>
 
              <div className="bg-accent p-8 rounded-[2.5rem] text-primary">
                <Users className="w-10 h-10 text-primary mb-6 opacity-30" />
                <h3 className="text-xl font-serif italic mb-2">Active Tenants</h3>
                <p className="text-4xl font-serif italic mb-6">0</p>
                <button className="w-full py-4 bg-primary text-accent text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/95 transition-all">
                  Manage Tenants
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav type="landlord" />
    </div>
  );
}
