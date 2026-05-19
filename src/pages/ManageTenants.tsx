/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  Users, Search, Filter, Mail, Phone, 
  MapPin, Calendar, FileText, AlertTriangle,
  History, MessageSquare, MoreVertical,
  CheckCircle2, XCircle, ArrowLeft,
  Briefcase, Heart, Building, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const mockTenants: any[] = [];
 
export default function ManageTenants() {
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
 
  return (
    <div className="bg-secondary min-h-screen">
      <Sidebar type="landlord" />
      
      <div className="md:pl-24 lg:pl-72 pt-10 pb-32 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col gap-4 mb-12">
            <Link 
              to="/dashboard/landlord"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-accent transition-colors mb-2"
            >
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>
            <div>
              <h1 className="text-5xl font-serif italic text-primary">Manage Tenants</h1>
              <p className="text-primary/40 mt-2">Oversee your active leases, track reports, and maintain relationships.</p>
            </div>
          </header>
 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tenant Directory */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-primary/5 shadow-xl shadow-primary/5">
                <div className="flex justify-between items-center mb-6 px-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Tenant Directory</h3>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-all">
                    <Search className="w-4 h-4 text-primary/20" />
                  </button>
                </div>
                <div className="space-y-2">
                  {mockTenants.length > 0 ? mockTenants.map(tenant => (
                    <button
                      key={tenant.id}
                      onClick={() => setSelectedTenant(tenant)}
                      className={cn(
                        "w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 group",
                        selectedTenant?.id === tenant.id 
                          ? "bg-primary text-secondary shadow-lg shadow-primary/20" 
                          : "hover:bg-secondary/50 text-primary"
                      )}
                    >
                      <img src={tenant.avatar} className="w-12 h-12 rounded-xl object-cover" alt={tenant.name} />
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm leading-tight">{tenant.name}</h4>
                        <p className={cn("text-[9px] uppercase tracking-widest font-bold mt-0.5", selectedTenant?.id === tenant.id ? "text-accent/60" : "text-primary/40")}>{tenant.property}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="py-12 text-center flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 text-primary/10 mb-4" />
                      <p className="text-[10px] text-primary/30 font-bold uppercase tracking-widest">No active tenants</p>
                    </div>
                  )}
                </div>
              </div>
 
              <div className="bg-primary p-8 rounded-[2.5rem] text-secondary">
                <Briefcase className="w-10 h-10 text-accent mb-6 opacity-30" />
                <h3 className="text-xl font-serif italic mb-2">New Applications</h3>
                <p className="text-primary/40 text-xs mb-6">You have 0 pending property applications to review.</p>
                <button className="w-full py-4 bg-accent text-primary font-bold text-[10px] uppercase tracking-widest rounded-full hover:bg-white transition-all shadow-lg opacity-50 cursor-not-allowed">
                  Review Applications
                </button>
              </div>
            </div>
 
            {/* Tenant Profile View */}
            <div className="lg:col-span-2 space-y-8">
              {selectedTenant ? (
                <>
                  {/* Profile Card */}
                  <section className="bg-white p-10 rounded-[3rem] border border-primary/5 shadow-xl shadow-primary/5 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
                      <div className="relative">
                        <img src={selectedTenant.avatar} className="w-32 h-32 rounded-[2rem] object-cover shadow-2xl" alt={selectedTenant.name} />
                        <div className="absolute -bottom-2 -right-2 bg-accent text-primary p-2 rounded-xl shadow-lg border-4 border-white">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-4xl font-serif italic text-primary">{selectedTenant.name}</h2>
                            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.2em] mt-1">{selectedTenant.status}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                          <div className="bg-secondary/50 p-4 rounded-2xl">
                            <p className="text-[9px] text-primary/40 uppercase font-bold tracking-widest mb-1">Leased Since</p>
                            <p className="font-bold text-primary">{selectedTenant.start}</p>
                          </div>
                          <div className="bg-secondary/50 p-4 rounded-2xl">
                            <p className="text-[9px] text-primary/40 uppercase font-bold tracking-widest mb-1">Monthly Rent</p>
                            <p className="font-bold text-primary">{selectedTenant.rent}</p>
                          </div>
                          <div className="bg-secondary/50 p-4 rounded-2xl col-span-2 lg:col-span-1">
                            <p className="text-[9px] text-primary/40 uppercase font-bold tracking-widest mb-1">Last Inspection</p>
                            <p className="font-bold text-primary">N/A</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Building className="absolute -right-12 -bottom-12 w-64 h-64 text-primary/5 -rotate-12 pointer-events-none" />
                  </section>
                </>
              ) : (
                <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-primary/10 h-[400px] flex flex-col items-center justify-center text-center px-10">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-accent/40" />
                  </div>
                  <h3 className="text-2xl font-serif italic text-primary/60 mb-2">No Tenant Selected</h3>
                  <p className="text-sm text-primary/30 max-w-xs">Select a tenant from the directory to view their full profile and history.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <BottomNav type="landlord" />
    </div>
  );
}
