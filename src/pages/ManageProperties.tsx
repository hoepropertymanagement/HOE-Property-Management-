/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  Plus, MoreVertical, CheckCircle2, AlertCircle, Clock,
  Building, Search, Filter, ArrowLeft, ArrowRight,
  Eye, Edit, Trash2, MessageCircle, Loader2, X, MapPin
} from 'lucide-react';
import { Property, mockProperties } from '../constants/mockData';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function ManageProperties() {
  const isCollapsed = useSidebarCollapse();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedPreviewProperty, setSelectedPreviewProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedPreviewProperty]);

  useEffect(() => {
    async function fetchProperties() {
      if (!user) return;
      setLoading(true);
      try {
        // Query from Firestore matching logged-in user explicitly
        const q = query(
          collection(db, 'properties'), 
          where('landlordId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        
        // Query from Supabase explicitly filtering to show only properties belonging to the signed-in user
        let sbProps: Property[] = [];
        try {
          const { data: sbData, error: sbError } = await supabase
            .from('properties')
            .select('*')
            .eq('landlord_id', user.uid);
          
          if (!sbError && sbData) {
            sbProps = sbData.map((item: any) => ({
              id: item.id,
              title: item.title || item.name || 'Untitled Property',
              description: item.description || '',
              image: item.image || item.image_url || '',
              images: item.images || [],
              price: item.price || 0,
              beds: item.beds || item.bedrooms || 0,
              baths: item.baths || item.bathrooms || 0,
              status: item.status || 'Draft',
              landlordId: item.landlord_id || user.uid,
              views: item.views || 0,
              contactNumber: item.contact_number || '',
              councilTax: item.council_tax || 'Band A',
              energyEfficiency: item.energy_efficiency || 'E',
              environmentalImpact: item.environmental_impact || 'E',
            } as unknown as Property));
          }
        } catch (sbErr) {
          console.warn("Silent Supabase fetch error:", sbErr);
        }

        // Merge both properties lists
        const merged = [...props];
        sbProps.forEach(sbProp => {
          if (!merged.some(p => p.id === sbProp.id)) {
            merged.push(sbProp);
          }
        });

        // Merge with mock properties, dynamically assigning landlordId to current landlord
        mockProperties.forEach(mockItem => {
          if (!merged.some(p => p.id === mockItem.id)) {
            merged.push({
              ...mockItem,
              landlordId: user.uid
            });
          }
        });
        setProperties(merged);
      } catch (err) {
        console.error("Error fetching properties:", err);
        // Fallback to system-defined mock properties with in-memory landlordId mapping
        const fallback = mockProperties.map(m => ({ ...m, landlordId: user.uid }));
        setProperties(fallback);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [user]);

  const handleUpdateStatus = async (propertyId: string, newStatus: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db: firestoreDb } = await import('../lib/firebase');
      await updateDoc(doc(firestoreDb, 'properties', propertyId), {
        status: newStatus,
        updatedAt: new Date()
      });
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus } as Property : p));
    } catch (err) {
      console.error("Error updating property status:", err);
    }
  };

  const handleArchiveProperty = async (propertyId: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db: firestoreDb } = await import('../lib/firebase');
      await updateDoc(doc(firestoreDb, 'properties', propertyId), {
        status: 'Archived',
        updatedAt: new Date()
      });
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: 'Archived' } as Property : p));
    } catch (err) {
      console.error("Error archiving property:", err);
    }
  };

  const filteredProperties = filter === 'All' 
    ? properties 
    : properties.filter(p => p.status === filter);

  return (
    <div className="bg-secondary min-h-screen">
      <Sidebar type="landlord" />
      
      <div className={cn(
        "pt-10 pb-32 px-4 sm:px-6 lg:px-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
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
                        <div 
                          onClick={() => setSelectedPreviewProperty(p)} 
                          className="flex items-center gap-4 group/item cursor-pointer"
                        >
                          <div className="relative">
                            {p.image ? (
                              <img src={p.image} className="w-16 h-16 rounded-2xl object-cover shadow-sm transition-transform group-hover/item:scale-105" alt={p.title} />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-primary/5 transition-transform group-hover/item:scale-105">
                                <Building className="w-8 h-8 text-primary/10" />
                              </div>
                            )}
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-white flex items-center justify-center">
                              <Eye className="w-2.5 h-2.5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-primary group-hover:text-accent transition-colors text-base">{p.title}</p>
                            <p className="text-[10px] text-primary/40 font-medium uppercase tracking-wider group-hover:text-accent/60 transition-colors">{p.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-primary">{p.price}</p>
                        <p className="text-[10px] text-primary/30 uppercase font-bold tracking-tighter">PCM</p>
                      </td>
                      <td className="px-8 py-6">
                        <span 
                          onClick={() => {
                            if (p.status === 'Draft') {
                              navigate(`/dashboard/landlord/add?id=${p.id}`);
                            }
                          }}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 w-fit shadow-sm border transition-all duration-300 select-none",
                            p.status === 'Live' ? "bg-green-50 text-green-600 border-green-100" :
                            p.status === 'Let Agreed' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                            p.status === 'Paused' ? "bg-orange-50 text-orange-600 border-orange-100" :
                            p.status === 'Archived' ? "bg-red-50 text-red-600 border-red-100" :
                            "bg-amber-50 text-amber-700 border-amber-200 cursor-pointer hover:bg-black hover:text-accent hover:border-accent active:scale-95 shadow-md hover:shadow-accent/10" // Draft
                          )}
                        >
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
                          <Link to={`/dashboard/landlord/add?id=${p.id}`} className="p-3 bg-secondary hover:bg-primary hover:text-accent rounded-xl transition-all group/btn shadow-sm">
                            <Edit className="w-4 h-4" />
                          </Link>
                          {p.status === 'Live' ? (
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'Paused')}
                              className="p-3 bg-secondary hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-all shadow-sm" 
                              title="Pause Listing"
                            >
                               <Clock className="w-4 h-4" />
                            </button>
                          ) : p.status === 'Paused' ? (
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'Live')}
                              className="p-3 bg-secondary hover:bg-green-50 hover:text-green-500 rounded-xl transition-all shadow-sm" 
                              title="Resume Listing"
                            >
                               <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button 
                            onClick={() => handleArchiveProperty(p.id)}
                            className="p-3 bg-secondary hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shadow-sm" 
                            title="Archive Listing"
                          >
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

      {/* LANDLORD PROPERTY PREVIEW OVERLAY */}
      <AnimatePresence>
        {selectedPreviewProperty && (() => {
          const previewImages = selectedPreviewProperty.images && selectedPreviewProperty.images.length > 0 
            ? selectedPreviewProperty.images 
            : (selectedPreviewProperty.image ? [selectedPreviewProperty.image] : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200"]);
          
          const carouselImages = previewImages.slice(0, 3);
          const hasMoreImages = previewImages.length > 3;

          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[5000]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-[#15072c] border-2 border-accent/30 rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative p-8 md:p-10 shadow-2xl"
              >
                <button 
                  onClick={() => setSelectedPreviewProperty(null)}
                  className="absolute top-6 right-6 p-2 bg-black/60 hover:bg-accent hover:text-black border border-accent/20 rounded-full transition-colors z-20"
                >
                  <X className="w-5 h-5 text-accent" />
                </button>

                {/* IMAGE CAROUSEL SECTION */}
                <div className="relative rounded-[2rem] overflow-hidden h-64 md:h-80 mb-8 border border-accent/10">
                  <img 
                    src={carouselImages[activeImageIndex]} 
                    className="w-full h-full object-cover" 
                    alt={selectedPreviewProperty.title} 
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Left and Right Nav Arrows */}
                  {carouselImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-accent hover:text-black border border-accent/20 rounded-full transition-colors z-10"
                      >
                        <ArrowLeft className="w-4 h-4 text-accent" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-accent hover:text-black border border-accent/20 rounded-full transition-colors z-10"
                      >
                        <ArrowRight className="w-4 h-4 text-accent" />
                      </button>
                    </>
                  )}

                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      selectedPreviewProperty.status === 'Live' ? "bg-green-500/80 text-white border-green-500/20" : "bg-primary/80 text-white border-primary/20"
                    )}>
                      {selectedPreviewProperty.status}
                    </span>
                    <span className="px-4 py-1 bg-black/65 border border-[#c299ff]/30 text-[#c299ff] rounded-full text-[10px] font-bold uppercase tracking-widest">
                      EPC: {selectedPreviewProperty.energyEfficiency || selectedPreviewProperty.energy_efficiency || 'D'}
                    </span>
                    <span className="px-4 py-1 bg-black/60 text-accent/90 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Slide {activeImageIndex + 1} of {carouselImages.length}
                    </span>
                  </div>

                  {hasMoreImages && (
                    <div className="absolute bottom-4 right-4 z-10">
                      <Link
                        to={`/property/${selectedPreviewProperty.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-accent hover:bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-accent/20"
                      >
                        See More (+ {previewImages.length - 3} photos)
                      </Link>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 pt-16">
                    <h3 className="text-xl md:text-2xl font-serif italic text-white leading-tight">{selectedPreviewProperty.title}</h3>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-baseline border-b border-accent/10 pb-6">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Property Location</p>
                      <p className="text-white font-semibold text-lg flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-accent" /> {selectedPreviewProperty.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Monthly Rent</p>
                      <p className="text-2xl md:text-3xl font-serif text-accent italic font-black">
                        {typeof selectedPreviewProperty.price === 'number' ? `£${selectedPreviewProperty.price.toLocaleString()}` : selectedPreviewProperty.price}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-b border-accent/10 pb-6">
                    <div className="p-4 bg-[#1b0a32] rounded-2xl border border-accent/5 text-center">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Bedrooms</p>
                      <p className="text-xl font-bold font-mono text-accent">{selectedPreviewProperty.beds || selectedPreviewProperty.bedrooms || 2}</p>
                    </div>
                    <div className="p-4 bg-[#1b0a32] rounded-2xl border border-accent/5 text-center">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Bathrooms</p>
                      <p className="text-xl font-bold font-mono text-accent">{selectedPreviewProperty.baths || selectedPreviewProperty.bathrooms || 1}</p>
                    </div>
                    <div className="p-4 bg-[#1b0a32] rounded-2xl border border-accent/5 text-center">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Council Tax</p>
                      <p className="text-sm font-black font-semibold text-[#c299ff] mt-1">{selectedPreviewProperty.councilTax || selectedPreviewProperty.council_tax || 'Band D'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[#c299ff] font-bold mb-3">Narrative description</h4>
                    <p className="text-[#c299ff]/80 text-sm leading-relaxed text-left whitespace-pre-line bg-[#130728]/50 p-6 rounded-2xl border border-accent/5 font-medium">
                      {selectedPreviewProperty.description || "No full description added yet."}
                    </p>
                  </div>

                  <div className="border-t border-accent/10 pt-6 flex flex-wrap justify-end gap-3">
                    <span className="text-[10px] bg-accent/10 text-accent font-bold uppercase tracking-widest py-2 px-4 rounded-full border border-accent/15 mr-auto flex items-center gap-1 my-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Renters Rights Act Approved
                    </span>
                    
                    {selectedPreviewProperty.status === 'Draft' ? (
                      <button 
                        onClick={() => {
                          setSelectedPreviewProperty(null);
                          navigate(`/dashboard/landlord/add?id=${selectedPreviewProperty.id}`);
                        }}
                        className="px-6 py-2.5 bg-accent text-black font-semibold uppercase tracking-widest text-[9px] rounded-full hover:bg-white transition-colors"
                      >
                        Resume Draft
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedPreviewProperty(null);
                          navigate(`/dashboard/landlord/add?id=${selectedPreviewProperty.id}`);
                        }}
                        className="px-6 py-2.5 bg-[#1e0a34] border border-accent/30 hover:border-accent text-accent font-semibold uppercase tracking-widest text-[9px] rounded-full transition-colors"
                      >
                        Edit Listing
                      </button>
                    )}

                    {selectedPreviewProperty.status === 'Live' && (
                      <Link 
                        to={`/property/${selectedPreviewProperty.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-2.5 bg-[#122e1e] border border-green-500/30 hover:border-green-400 text-green-400 font-semibold uppercase tracking-widest text-[9px] rounded-full transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Live Portal View
                      </Link>
                    )}

                    <button 
                      onClick={() => setSelectedPreviewProperty(null)}
                      className="px-6 py-2.5 bg-zinc-850 border border-white/10 text-white font-semibold uppercase tracking-widest text-[9px] rounded-full hover:bg-zinc-800 transition-colors"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <BottomNav type="landlord" />
    </div>
  );
}
