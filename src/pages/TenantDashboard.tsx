import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { Property } from '../constants/mockData';
import PropertyCard from '../components/PropertyCard';
import { MessageSquare, Bell, Clock, ArrowUpRight, Heart, ArrowLeft, LayoutDashboard, Loader2 } from 'lucide-react';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function TenantDashboard() {
  const { savedIds } = useSavedProperties();
  const { profile, user } = useAuth();
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const isCollapsed = useSidebarCollapse();

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

  const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twighlightani113@gmail.com', 'twiglightani113@gmail.com', 'nkeface14@gmail.com'];
  const isAgentUser = user?.email && allowedAgentEmails.includes(user.email.toLowerCase());

  return (
    <div className="bg-secondary min-h-screen">
      <Sidebar type="tenant" />
      
      <div className={cn(
        "pt-10 pb-32 px-4 sm:px-6 lg:px-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-6 mb-8">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 hover:text-accent transition-all w-fit group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              Exit to Home
            </Link>
            {(profile?.role === 'both' || isAgentUser) && (
              <>
                <div className="w-px h-3 bg-primary/20" />
                <Link 
                  to="/dashboard?reselect=true" 
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent hover:text-accent/80 transition-all w-fit group"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Back to Portal Choice
                </Link>
              </>
            )}
          </div>
          
          <header className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-serif italic text-accent mb-2">Welcome back, Tenant</h1>
              <p className="text-primary/50 text-sm">You have 3 new notifications and 1 viewing coming up.</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Areas */}
            <div className="lg:col-span-2 space-y-12">
              {/* Saved Properties */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-serif italic text-primary">Saved Properties</h2>
                  <button className="px-6 py-2 bg-white rounded-full text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/5 hover:bg-primary hover:text-accent transition-all shadow-sm">
                    View All Saved
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-full py-10 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
                      <p className="text-[10px] text-primary/30 uppercase tracking-widest font-black">Retrieving Saved Homes...</p>
                    </div>
                  ) : savedProperties.length > 0 ? (
                    savedProperties.map(p => (
                      <PropertyCard key={p.id} property={p} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-primary/10 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                        <Heart className="w-10 h-10 text-accent/40" />
                      </div>
                      <h3 className="text-2xl font-serif italic text-primary/60 mb-2">Your wishlist is empty</h3>
                      <p className="text-sm text-primary/30 max-w-xs mb-8">Save properties you love to keep track of them and get updates.</p>
                      <button 
                        onClick={() => window.location.href = '/search'}
                        className="px-8 py-3 bg-primary text-secondary rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all shadow-lg"
                      >
                        Explore Listings
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Enquiries & Messages */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-serif italic text-primary">Enquiries & Messages</h2>
                  <Link to="/dashboard/tenant/messages" className="text-accent text-[11px] font-bold uppercase tracking-widest hover:underline flex items-center gap-2">
                    Open All Messages <MessageSquare className="w-4 h-4" />
                  </Link>
                </div>
                <div className="bg-white rounded-[3rem] border border-primary/5 shadow-xl shadow-primary/5 p-10 space-y-8">
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <MessageSquare className="w-12 h-12 text-primary/10 mb-4" />
                    <h4 className="text-xl font-serif italic text-primary/40 mb-1">No active conversations</h4>
                    <p className="text-[10px] text-primary/20 font-bold uppercase tracking-widest">Inquire about a property to start a chat.</p>
                  </div>
                </div>
              </section>
            </div>
 
            {/* Sidebar Stats / Alerts */}
            <div className="space-y-8">
              {/* Alerts */}
              <div className="bg-primary p-8 rounded-[2rem] text-secondary">
                <Bell className="w-8 h-8 text-accent mb-6" />
                <h3 className="text-xl font-serif italic mb-4">Market Alerts</h3>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/30">No new alerts today</p>
                </div>
              </div>
 
              {/* Viewings Timeline */}
              <div className="bg-white p-8 rounded-[2rem] border border-primary/5">
                <Clock className="w-8 h-8 text-accent mb-6" />
                <h3 className="text-xl font-serif italic text-primary mb-6">Upcoming Viewings</h3>
                <div className="space-y-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/20">No scheduled viewings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav type="tenant" />
    </div>
  );
}
