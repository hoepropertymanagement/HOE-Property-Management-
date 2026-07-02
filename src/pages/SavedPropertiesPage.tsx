import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { Property } from '../constants/mockData';
import PropertyCard from '../components/PropertyCard';
import { Heart, Landmark, ArrowLeft, Loader2 } from 'lucide-react';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function SavedPropertiesPage() {
  const { savedIds, toggleSave } = useSavedProperties();
  const isCollapsed = useSidebarCollapse();
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      if (savedIds.size === 0) {
        setSavedProperties([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, 'properties'), where('status', 'in', ['Live', 'Let Agreed']));
        const querySnapshot = await getDocs(q);
        const allProps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        const filtered = allProps.filter(p => savedIds.has(p.id));
        setSavedProperties(filtered);
      } catch (err) {
        console.error("Error fetching saved properties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [savedIds]);

  return (
    <div className="bg-secondary min-h-screen">
      <Sidebar type="tenant" />
      
      <div className={cn(
        "pt-10 pb-32 px-4 sm:px-6 lg:px-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
        <div className="max-w-6xl mx-auto">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 hover:text-accent transition-all mb-8 w-fit group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-4xl font-serif italic text-accent">Saved Properties</h1>
            </div>
            <p className="text-primary/50 text-sm uppercase tracking-widest font-bold">Your personal shortlist of dream homes</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                <p className="text-[10px] text-primary/30 uppercase tracking-widest font-black">Retrieving Saved Homes...</p>
              </div>
            ) : savedProperties.length > 0 ? (
              savedProperties.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <PropertyCard property={p} />
                  <div className="absolute top-4 right-4 z-20">
                    <button 
                      onClick={() => toggleSave(p.id)}
                      className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
                      title="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-primary/10 flex flex-col items-center justify-center text-center px-6">
                <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                  <Landmark className="w-12 h-12 text-accent/40" />
                </div>
                <h2 className="text-3xl font-serif italic text-primary/60 mb-2">No saved properties yet</h2>
                <p className="text-sm text-primary/30 max-w-sm mb-10">Start exploring our collections and heart the properties that catch your eye.</p>
                <Link 
                  to="/search"
                  className="px-12 py-4 bg-primary text-secondary rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent hover:text-primary transition-all shadow-xl shadow-primary/20"
                >
                  Explore Listings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav type="tenant" />
    </div>
  );
}
