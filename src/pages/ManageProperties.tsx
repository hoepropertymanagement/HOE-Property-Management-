/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  Plus, MoreVertical, CheckCircle2, AlertCircle, Clock,
  Building, Search, Filter, ArrowLeft, ArrowRight,
  Eye, Edit, Trash2, MessageCircle, Loader2
} from 'lucide-react';
import { Property } from '../constants/mockData';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function ManageProperties() {
  const [filter, setFilter] = useState('All');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProperties() {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'properties'), 
          where('landlordId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(props);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [user]);

  const filteredProperties = filter === 'All' 
    ? properties 
    : properties.filter(p => p.status === filter);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-5xl font-serif italic text-primary">Your Properties</h1>
                <p className="text-primary/40 mt-2">Manage listings, check status, and update details.</p>
              </div>
              <Link 
                to="/dashboard/landlord/add"
                className="bg-primary text-secondary px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-accent hover:text-primary transition-all shadow-xl shadow-primary/20"
              >
                <Plus className="w-5 h-5 text-accent" />
                Add New Property
              </Link>
            </div>
          </header>

          {/* Filters Bar */}
          <section className="bg-white p-6 rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-secondary p-1 rounded-2xl w-full md:w-auto">
              {['All', 'Live', 'Let Agreed', 'Draft'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    filter === status 
                      ? "bg-primary text-secondary shadow-lg shadow-primary/20" 
                      : "text-primary/40 hover:text-primary"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
              <input 
                type="text" 
                placeholder="Search your listings..." 
                className="w-full bg-secondary pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-1 ring-accent transition-all font-medium text-primary text-sm"
              />
            </div>
          </section>

          {/* Listings Table */}
          <section className="bg-white rounded-[2.5rem] border border-primary/5 shadow-xl shadow-primary/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-primary/5">
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/30">Property</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/30">Price</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/30">Status</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/30">Performance</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/30">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/30">Loading your portfolio...</p>
                      </td>
                    </tr>
                  ) : filteredProperties.length > 0 ? filteredProperties.map((p) => (
                    <tr key={p.id} className="group hover:bg-secondary/30 transition-colors border-b border-primary/5 last:border-0 font-sans">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {p.image ? (
                              <img src={p.image} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt={p.title} />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-primary/5">
                                <Building className="w-8 h-8 text-primary/10" />
                              </div>
                            )}
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-white flex items-center justify-center">
                              <Eye className="w-2.5 h-2.5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-primary group-hover:text-accent transition-colors text-base">{p.title}</p>
                            <p className="text-[10px] text-primary/40 font-medium uppercase tracking-wider">{p.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-primary">{p.price}</p>
                        <p className="text-[10px] text-primary/30 uppercase font-bold tracking-tighter">PCM</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 w-fit shadow-sm",
                          p.status === 'Live' ? "bg-green-50 text-green-600 border border-green-100" :
                          p.status === 'Let Agreed' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : 
                          p.status === 'Paused' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                          p.status === 'Archived' ? "bg-red-50 text-red-600 border border-red-100" :
                          "bg-amber-50 text-amber-600 border border-amber-200" // Draft
                        )}>
                          {p.status === 'Live' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                           p.status === 'Let Agreed' ? <Clock className="w-3.5 h-3.5" /> : 
                           p.status === 'Draft' ? <Edit className="w-3.5 h-3.5" /> :
                           <AlertCircle className="w-3.5 h-3.5" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary/40">
                            <span>Leads</span>
                            <span className="text-accent">{p.status === 'Live' ? '12' : '0'}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className={cn("h-full bg-accent rounded-full transition-all", p.status === 'Live' ? 'w-2/3' : 'w-0')} />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Link to="/dashboard/landlord/add" className="p-3 bg-secondary hover:bg-primary hover:text-accent rounded-xl transition-all group/btn shadow-sm">
                            <Edit className="w-4 h-4" />
                          </Link>
                          {p.status === 'Live' ? (
                            <button className="p-3 bg-secondary hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-all shadow-sm" title="Pause Listing">
                               <Clock className="w-4 h-4" />
                            </button>
                          ) : p.status === 'Paused' ? (
                            <button className="p-3 bg-secondary hover:bg-green-50 hover:text-green-500 rounded-xl transition-all shadow-sm" title="Resume Listing">
                               <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button className="p-3 bg-secondary hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shadow-sm" title="Archive Listing">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-primary/30">
                          <Building className="w-16 h-16 mb-4 opacity-20" />
                          <h3 className="text-xl font-serif italic mb-2">No properties found</h3>
                          <p className="text-sm font-medium uppercase tracking-widest mb-8">Start by adding your first listing to the platform.</p>
                          <Link 
                            to="/dashboard/landlord/add"
                            className="text-accent font-black uppercase tracking-[0.3em] text-[10px] hover:underline"
                          >
                            Create Listing +
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-8 border-t border-primary/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">
              <span>Showing {filteredProperties.length > 0 ? `1-${filteredProperties.length}` : '0'} of {filteredProperties.length} results</span>
              <div className="flex gap-4">
                <button className="opacity-50 cursor-not-allowed flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Prev
                </button>
                <div className="flex gap-2">
                  <span className="text-accent underline">01</span>
                </div>
                <button className="opacity-50 cursor-not-allowed flex items-center gap-1">
                  Next <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <BottomNav type="landlord" />
    </div>
  );
}
