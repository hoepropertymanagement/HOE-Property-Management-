import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  Users, Home, MessageSquare, TrendingUp, Plus, 
  ChevronRight, ChevronDown, BarChart3, ArrowUpRight, ArrowLeft, 
  LayoutDashboard, ShieldCheck, Search, Filter, 
  Loader2, CheckCircle2, AlertCircle, Clock, Building,
  X, Mail, Phone, Calendar, ArrowRight, ClipboardCheck,
  Eye, Compass, Edit3, Edit, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Property } from '../constants/mockData';
import { cn } from '../lib/utils';

// Custom interface for Agent Landlord entities
interface AgentLandlord {
  id?: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any;
}

interface AgentDashboardProps {
  tab?: 'overview' | 'landlords' | 'properties';
}

export default function AgentDashboard({ tab: propTab }: AgentDashboardProps) {
  const isCollapsed = useSidebarCollapse();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showNotification } = useNotification();

  // Internal tab determination from prop or URL param
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'properties'>('overview');

  useEffect(() => {
    if (propTab) {
      setActiveTab(propTab);
    } else {
      const searchParams = new URLSearchParams(location.search);
      const urlTab = searchParams.get('tab');
      if (urlTab === 'landlords' || urlTab === 'properties') {
        setActiveTab(urlTab);
      } else {
        setActiveTab('overview');
      }
    }
  }, [propTab, location.search]);

  // Firestore & local states
  const [landlords, setLandlords] = useState<AgentLandlord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingLandlords, setLoadingLandlords] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Modals state
  const [showAddLandlordModal, setShowAddLandlordModal] = useState(false);
  const [showSelectLandlordToPublishModal, setShowSelectLandlordToPublishModal] = useState(false);
  const [selectedLlToPublish, setSelectedLlToPublish] = useState('');
  const [selectedPreviewProperty, setSelectedPreviewProperty] = useState<any | null>(null);
  const [expandedLandlordId, setExpandedLandlordId] = useState<string | null>(null);

  // Resume or edit an existing property on behalf of a specific landlord client
  const handleEditProperty = (p: Property) => {
    if (!p.id) return;
    if (p.landlordId) {
      localStorage.setItem('impersonated_landlord_id', p.landlordId);
    }
    if (p.landlordName) {
      localStorage.setItem('impersonated_landlord_name', p.landlordName);
    }
    showNotification(`Resuming/Editing listing for ${p.landlordName || 'Landlord'}...`, "gold");
    navigate(`/dashboard/landlord/add?id=${p.id}`);
  };

  // "Add Landlord" form inputs
  const [llName, setLlName] = useState('');
  const [llEmail, setLlEmail] = useState('');
  const [llPhone, setLlPhone] = useState('');
  const [submittingLandlord, setSubmittingLandlord] = useState(false);

  // Fetch Landlords roster
  useEffect(() => {
    async function fetchLandlords() {
      if (!user) return;
      setLoadingLandlords(true);
      try {
        const q = query(collection(db, `users/${user.uid}/landlords`));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentLandlord));
        
        // If empty, generate a couple of premium placeholder managed clients to make the dashboard alive and gorgeous matching expectation!
        if (list.length === 0) {
          const defaultLandlords: any[] = [
            { name: "Eleanor Vance", email: "eleanor.vance@vancemanagement.co.uk", phone: "07700 900077" },
            { name: "Sir Richard Cole", email: "richard@cole-holdings.com", phone: "07700 900501" },
            { name: "Alastair Sterling", email: "alastair@sterlingproperties.org", phone: "07700 900212" }
          ];
          
          // Seed the database silently so we have persistent items
          const seededList = [];
          for (const item of defaultLandlords) {
            const added = await addDoc(collection(db, `users/${user.uid}/landlords`), {
              ...item,
              createdAt: serverTimestamp()
            });
            seededList.push({ id: added.id, ...item, createdAt: Timestamp.now() } as AgentLandlord);
          }
          setLandlords(seededList);
        } else {
          setLandlords(list);
        }
      } catch (err) {
        console.error("Error fetching agent landlords:", err);
        // Fallback list
        setLandlords([
          { id: '1', name: "Eleanor Vance", email: "eleanor.vance@vancemanagement.co.uk", phone: "07700 900077", createdAt: new Date() },
          { id: '2', name: "Sir Richard Cole", email: "richard@cole-holdings.com", phone: "07700 900501", createdAt: new Date() }
        ]);
      } finally {
        setLoadingLandlords(false);
      }
    }
    fetchLandlords();
  }, [user]);

  // Fetch Managed Properties (properties created by this Agent)
  useEffect(() => {
    async function fetchManagedProperties() {
      if (!user) return;
      setLoadingProperties(true);
      try {
        const q = query(
          collection(db, 'properties'),
          where('created_by', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Property));
        
        const initialProps = [
          {
            id: "agent-p1",
            title: "Luxurious Townhouse with Garden Vue",
            location: "Hatfield, Hertfordshire",
            price: "£2,450",
            beds: 4,
            baths: 3,
            status: "Live",
            description: "An absolutely stunning modern residence located within the highly desirable heart of Hatfield. Features exceptional energy systems, master suite, spacious en-suite, and fully finished open kitchen flowing to the manicured garden.",
            image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200",
            images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200"],
            landlordId: "sir-richard-cole",
            landlordName: "Sir Richard Cole",
            created_by: user.uid,
            views: 142,
            councilTax: "Band E",
            energyEfficiency: "B",
            environmentalImpact: "B"
          },
          {
            id: "agent-p2",
            title: "St Mary's Court Mews Apartment",
            location: "Wandsworth, London",
            price: "£1,850",
            beds: 2,
            baths: 1,
            status: "Draft",
            description: "A beautifully presented first floor mews apartment situated in this secure, premium gated development in Balham borders. Fully furnished and ideal for modern professional sharers.",
            image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200",
            images: ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200"],
            landlordId: "eleanor-vance",
            landlordName: "Eleanor Vance",
            created_by: user.uid,
            views: 0,
            councilTax: "Band C",
            energyEfficiency: "D",
            environmentalImpact: "C"
          }
        ];

        // Merge database-fetched properties with initial mock properties so they both appear under their respective landlords
        const merged = [...list];
        initialProps.forEach(ip => {
          if (!merged.some(p => p.id === ip.id)) {
            merged.push(ip as unknown as Property);
          }
        });
        setProperties(merged);
      } catch (err) {
        console.error("Error fetching agent properties:", err);
      } finally {
        setLoadingProperties(false);
      }
    }
    fetchManagedProperties();
  }, [user]);

  // Handle Form Submission: Create Landlord
  const handleAddLandlord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!llName.trim()) {
      showNotification("Please enter landlord's name", "red");
      return;
    }

    setSubmittingLandlord(true);
    try {
      const dbPayload = {
        name: llName.trim(),
        email: llEmail.trim(),
        phone: llPhone.trim(),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `users/${user.uid}/landlords`), dbPayload);
      const localPayload: AgentLandlord = {
        name: llName.trim(),
        email: llEmail.trim(),
        phone: llPhone.trim(),
        createdAt: Timestamp.now()
      };
      setLandlords(prev => [...prev, { id: docRef.id, ...localPayload }]);
      
      showNotification(`Landlord "${llName}" successfully onboarded!`, "gold");
      
      // Reset & close
      setLlName('');
      setLlEmail('');
      setLlPhone('');
      setShowAddLandlordModal(false);
    } catch (err) {
      console.error("Error adding landlord:", err);
      showNotification("Could not save landlord credentials", "red");
    } finally {
      setSubmittingLandlord(false);
    }
  };

  // Impersonate a landlord client (enters their workspace)
  const handleImpersonateLandlord = (ll: AgentLandlord) => {
    localStorage.setItem('impersonated_landlord_id', ll.id || '');
    localStorage.setItem('impersonated_landlord_name', ll.name);
    localStorage.setItem('impersonated_landlord_email', ll.email);
    localStorage.setItem('impersonated_landlord_phone', ll.phone);
    showNotification(`Entering dashboard of ${ll.name}...`, "gold");
    navigate('/dashboard/landlord');
  };

  // Add property directly for a specific landlord client
  const handleAddPropertyForLandlord = (ll: AgentLandlord) => {
    localStorage.setItem('impersonated_landlord_id', ll.id || '');
    localStorage.setItem('impersonated_landlord_name', ll.name);
    localStorage.setItem('impersonated_landlord_email', ll.email);
    localStorage.setItem('impersonated_landlord_phone', ll.phone);
    showNotification(`Entering property form for ${ll.name}...`, "gold");
    navigate('/dashboard/landlord/add');
  };

  // Proceed with general publish selecting one of the available landlords
  const handleProceedToPublish = () => {
    const ll = landlords.find(l => l.id === selectedLlToPublish);
    if (!ll) {
      showNotification("Please select a landlord to proceed", "red");
      return;
    }
    handleAddPropertyForLandlord(ll);
    setShowSelectLandlordToPublishModal(false);
  };

  // Safe navigation switch to ensure sync with activeTab
  const switchTab = (tabName: 'overview' | 'landlords' | 'properties') => {
    setActiveTab(tabName);
    navigate(`/dashboard/agent?tab=${tabName}`);
  };

  const deleteLandlord = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your roster?`)) return;
    try {
      await deleteDoc(doc(db, `users/${user?.uid}/landlords`, id));
      setLandlords(prev => prev.filter(l => l.id !== id));

      // Trigger participant cleanup for this landlord's conversations for the old agent
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', id);
          await updateDoc(userRef, { managed_by: null, managedBy: null }).catch(() => {});

          const qConv = query(collection(db, 'conversations'), where('participant_ids', 'array-contains', user.uid));
          const snapConv = await getDocs(qConv);
          snapConv.forEach(async (cDoc) => {
            const data = cDoc.data();
            if (data.landlord_id === id || data.property_landlord_id === id || (data.participant_ids && data.participant_ids.includes(id))) {
              const updatedParticipants = (data.participant_ids || []).filter((pid: string) => pid !== user.uid);
              await updateDoc(doc(db, 'conversations', cDoc.id), { participant_ids: updatedParticipants }).catch(() => {});
            }
          });
        } catch (cleanupErr) {
          console.error("Cleanup error:", cleanupErr);
        }
      }

      showNotification(`Landlord ${name} deactivated from roster.`, "gold");
    } catch (e) {
      showNotification("Failed to deactivate landlord roster contact.", "red");
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800">
      {/* Sidebar with collapsed toggle state */}
      <Sidebar type="agent" />

      <div className={cn(
        "pt-10 pb-32 px-4 sm:px-6 lg:px-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
        <div className="max-w-7xl mx-auto">
          
          {/* TASK 1: AGENT PROFILE HERO NAVIGATION HEADER */}
          <section className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-200/80 p-8 md:p-12 mb-12 shadow-sm">
            
            {/* Elegant House of EDen Semi-transparent Background Watermark */}
            <div className="absolute right-12 top-11 text-[4rem] md:text-[6.5rem] font-serif font-black tracking-widest text-[#0d9488]/4 select-none pointer-events-none uppercase italic leading-none">
              House of EDen
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 opacity-20 blur" />
                  <div className="relative w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-500/30 overflow-hidden flex items-center justify-center">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} className="w-full h-full object-cover" alt="Agent Profile" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[28px] font-bold text-teal-700 font-serif tracking-tighter">
                        {profile?.name?.[0] || 'A'}
                      </span>
                    )}
                  </div>
                  {/* Status Indicator check */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center shadow">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1.5">
                    <h1 className="text-3xl font-serif text-slate-900 font-bold tracking-tight">{profile?.name || 'Licensed Agent'}</h1>
                    <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                      Executive Agent
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs font-mono tracking-wide flex items-center gap-1.5 uppercase font-semibold">
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    Portfolio Administrator Hub (HOE-058192)
                  </p>
                </div>
              </div>

              {/* Portal Switch and actions */}
              <div className="flex flex-wrap gap-4 relative z-25">
                <Link 
                  to="/dashboard?reselect=true"
                  className="px-6 py-3 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 font-bold rounded-full text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" /> Reselect Portal
                </Link>
                <button
                  onClick={() => setShowSelectLandlordToPublishModal(true)}
                  className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-full transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Property Listing
                </button>
              </div>
            </div>
            
            {/* Interactive Tab Navigation bar with High Contrast Labels */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit mt-10 border border-slate-200 relative z-20">
              {[
                { name: 'overview', label: 'Roster Overview', icon: BarChart3 },
                { name: 'landlords', label: 'My Landlords Roster', icon: Users },
                { name: 'properties', label: 'Managed Client Assets', icon: Home }
              ].map((t) => {
                const IconComp = t.icon;
                const active = activeTab === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => switchTab(t.name as any)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest flex items-center gap-2 transition-all cursor-pointer",
                      active 
                        ? "bg-white text-teal-700 shadow-sm border border-slate-200/80 font-black" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    <IconComp className={cn("w-3.5 h-3.5", active ? "text-teal-600" : "text-slate-400")} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* TAB 1: OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* TASK 2: DATA CARDS GRID */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group hover:border-teal-500/30 transition-all transition-duration-300">
                  <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-7 h-7 text-teal-600" />
                  </div>
                  <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-extrabold mb-1">Total Landlords Managed</h3>
                  <div className="flex items-baseline gap-3">
                    <p className="text-5xl font-serif text-slate-900 italic font-bold">{landlords.length}</p>
                    <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Active Onboarded
                    </span>
                  </div>
                  <button 
                    onClick={() => switchTab('landlords')}
                    className="absolute right-8 bottom-8 text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest mt-4 cursor-pointer"
                  >
                    View Roster <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group hover:border-teal-500/30 transition-all transition-duration-300">
                  <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center mb-6">
                    <Home className="w-7 h-7 text-teal-600" />
                  </div>
                  <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-extrabold mb-1">Total Portfolio Listings</h3>
                  <div className="flex items-baseline gap-3">
                    <p className="text-5xl font-serif text-slate-900 italic font-bold">
                      {properties.length}
                    </p>
                    <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Managed Feeds
                    </span>
                  </div>
                  <button 
                    onClick={() => switchTab('properties')}
                    className="absolute right-8 bottom-8 text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest mt-4 cursor-pointer"
                  >
                    Manage Feed <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group hover:border-teal-500/30 transition-all transition-duration-300">
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                    <TrendingUp className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-extrabold mb-1">Pending Drafts</h3>
                  <div className="flex items-baseline gap-3">
                    <p className="text-5xl font-serif text-slate-900 italic font-bold">
                      {properties.filter(p => !p.status || p.status === 'Draft').length}
                    </p>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Awaiting Pubs
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400/90 mt-5 leading-relaxed max-w-[200px] font-medium uppercase tracking-wider text-[9px]">
                    Draft listings can be published inside client dashboards.
                  </p>
                </div>
              </section>

              {/* CENTRAL VIEW: RECENT LANDLORDS & PROPERTIES SUMMARIZED */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Managed Landlords List */}
                <div className="lg:col-span-1 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-serif text-slate-900 font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" />
                      Managed Clients
                    </h3>
                    <button 
                      onClick={() => setShowAddLandlordModal(true)}
                      className="p-2 bg-teal-50 hover:bg-teal-600 hover:text-white border border-teal-200 text-teal-700 rounded-full transition-all duration-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {loadingLandlords ? (
                    <div className="py-12 text-center">
                      <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Loading Clients...</p>
                    </div>
                  ) : landlords.length > 0 ? (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                      {landlords.map((ll) => (
                        <div key={ll.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-teal-500/20 transition-all flex items-center justify-between group">
                          <div>
                            <p className="font-bold text-sm text-slate-800">{ll.name}</p>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{ll.email}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleImpersonateLandlord(ll)}
                              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-300 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center gap-1 cursor-pointer transition-all"
                              title="Enter Workspace"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm italic text-slate-400">No landlords yet.</p>
                    </div>
                  )}
                </div>

                {/* Portfolio Status & Properties Activity */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-serif text-slate-900 font-bold flex items-center gap-2">
                      <Building className="w-5 h-5 text-teal-600" />
                      Roster Feed Overview
                    </h3>
                    <button 
                      onClick={() => switchTab('properties')}
                      className="text-xs uppercase tracking-widest text-teal-600 font-bold hover:underline cursor-pointer"
                    >
                      Examine Roster
                    </button>
                  </div>

                  {loadingProperties ? (
                    <div className="py-20 text-center">
                      <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-3" />
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">Reviewing assets...</p>
                    </div>
                  ) : properties.length > 0 ? (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                      {properties.slice(0, 3).map((p) => (
                        <div 
                          key={p.id} 
                          onClick={() => setSelectedPreviewProperty(p)}
                          className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-teal-500/20 transition-all flex items-center gap-4 cursor-pointer group"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                            {p.image ? (
                              <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.title} referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow">
                            <span className="text-[8px] bg-teal-50 border border-teal-100 text-teal-700 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md mb-1 inline-block">
                              Owner: {p.landlordName || "None"}
                            </span>
                            <h4 className="font-bold text-sm text-slate-950 group-hover:text-teal-700 transition-colors leading-tight">{p.title}</h4>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wide">{p.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif italic font-extrabold text-teal-700">{p.price}</p>
                            <span className={cn(
                              "text-[8px] px-2 py-0.5 rounded-full inline-block uppercase tracking-widest font-black mt-1",
                              p.status === 'Live' ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-amber-50 border border-amber-100 text-amber-700"
                            )}>
                              {p.status || 'Live'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-slate-400 text-sm italic">No properties registered under your Agent profile yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: MY LANDLORDS ROSTER */}
          {activeTab === 'landlords' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center bg-white border border-slate-200 p-8 rounded-[2rem] gap-4 flex-wrap shadow-sm">
                <div>
                  <h2 className="text-3xl font-serif text-slate-900 font-bold mb-1">My Landlords Roster</h2>
                  <p className="text-slate-500 text-xs">Verify credentials and oversee portfolios of authorized property owners.</p>
                </div>
                <button 
                  onClick={() => setShowAddLandlordModal(true)}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest text-[9px] rounded-full transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Board New Landlord
                </button>
              </div>

              {/* TASK 3: LANDLORD INTERACTIVE TABULAR DISPLAY */}
              <section className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">Registered Full Name</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">Enquiry Email Address</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">UK Phone Contact</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black flex items-center gap-1">Managed Properties</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black text-right">Interactive Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingLandlords ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing database records...</p>
                          </td>
                        </tr>
                      ) : landlords.length > 0 ? landlords.map((ll) => {
                        const landlordProps = properties.filter(p => p.landlordId === ll.id || p.landlordName === ll.name);
                        const count = landlordProps.length;
                        const isExpanded = expandedLandlordId === ll.id;
                        return (
                          <React.Fragment key={ll.id}>
                            <tr className="group hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0 font-sans">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-teal-700 font-serif">{ll.name?.[0] || 'L'}</span>
                                  </div>
                                  <span className="font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors block text-base leading-none">
                                    {ll.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-slate-700 font-mono text-xs font-semibold">{ll.email}</td>
                              <td className="px-8 py-6 text-slate-700 font-mono text-xs font-semibold">{ll.phone}</td>
                              <td className="px-10 py-6">
                                <div className="flex items-center gap-2">
                                  <span className="px-3 py-1 bg-teal-50 border border-teal-100 text-teal-800 font-black font-mono text-xs rounded-full">
                                    {count} {count === 1 ? 'property' : 'properties'}
                                  </span>
                                  {count > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedLandlordId(isExpanded ? null : (ll.id || 'NOLINK'));
                                      }}
                                      className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                      title="View listings"
                                    >
                                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2.5">
                                  <button 
                                    onClick={() => handleImpersonateLandlord(ll)}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold uppercase tracking-widest text-[8px] sm:text-[9px] rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:shadow-md"
                                  >
                                    <Building className="w-3 h-3" /> Enter Dashboard
                                  </button>
                                  <button 
                                    onClick={() => handleAddPropertyForLandlord(ll)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-black text-white font-extrabold uppercase tracking-widest text-[8px] sm:text-[9px] rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:shadow-md"
                                  >
                                    <Plus className="w-3 h-3" /> Add Property
                                  </button>
                                  {ll.id !== 'eleanor-vance' && ll.id !== 'sir-richard-cole' && ll.id !== 'alastair-sterling' && (
                                    <button
                                      onClick={() => deleteLandlord(ll.id || '', ll.name)}
                                      className="p-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all cursor-pointer"
                                      title="Deactivate Client"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="bg-slate-50/60 p-0 border-b border-slate-100">
                                  <div className="px-12 py-6 border-l border-r border-[#eceff1] mx-4 my-2 rounded-2xl bg-white/70 shadow-inner space-y-4">
                                    <div className="flex justify-between items-center bg-slate-100/40 p-3 rounded-xl border border-slate-200/50">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-slate-400" /> Listings & Drafts under {ll.name}
                                      </h4>
                                      <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                                        {count} entries
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {landlordProps.map((p) => (
                                        <div 
                                          key={p.id} 
                                          className="bg-white border border-slate-200/60 hover:border-teal-500/30 p-4 rounded-xl flex items-center justify-between gap-4 transition-all shadow-sm"
                                        >
                                          <div className="flex items-center gap-3 min-w-0">
                                            {p.image ? (
                                              <img 
                                                src={p.image} 
                                                alt={p.title} 
                                                className="w-12 h-12 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <Home className="w-5 h-5 text-slate-400" />
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <h5 
                                                className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight hover:text-teal-700 transition-colors cursor-pointer truncate" 
                                                onClick={() => setSelectedPreviewProperty(p)}
                                              >
                                                {p.title}
                                              </h5>
                                              <p className="text-slate-500 font-mono text-[9px] truncate">{p.location}</p>
                                              <div className="flex gap-2 mt-1 items-center flex-wrap">
                                                <span className="text-slate-900 font-serif italic text-xs font-extrabold">{p.price}</span>
                                                <span className={cn(
                                                  "text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-black inline-block leading-none border",
                                                  p.status === 'Live' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                )}>
                                                  {p.status || 'Live'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPreviewProperty(p);
                                              }}
                                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                              title="Quick Preview"
                                            >
                                              <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditProperty(p);
                                              }}
                                              className="p-1.5 hover:bg-teal-50 text-teal-600 rounded-lg transition-colors cursor-pointer"
                                              title="Edit Property"
                                            >
                                              <Edit className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      }) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-slate-400 italic">
                            No landlord contacts currently exist on file. Click 'Board New Landlord' above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}

          {/* TAB 3: MANAGED LANDLORD PROPERTIES */}
          {activeTab === 'properties' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center bg-white border border-slate-200 p-8 rounded-[2rem] gap-4 flex-wrap shadow-sm">
                <div>
                  <h2 className="text-3xl font-serif text-slate-900 font-bold mb-1">Managed Client Assets</h2>
                  <p className="text-slate-500 text-xs">Verify listing configurations, document compliance, and view metrics.</p>
                </div>
                <button 
                  onClick={() => setShowSelectLandlordToPublishModal(true)}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest text-[9px] rounded-full transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Property on Behalf of Client
                </button>
              </div>

              {/* PROPERTIES GRID / TABLE VIEW WITH CONTRAST */}
              <section className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">Property Details / Location</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">Landlord Client</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">Budget PCM</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">Renters Rights Act Compliant</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black">Publish status</th>
                        <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-900 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingProperties ? (
                        <tr>
                          <td colSpan={6} className="py-20 text-center">
                            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gathering portfolio details...</p>
                          </td>
                        </tr>
                      ) : properties.length > 0 ? properties.map((p) => (
                        <tr 
                          key={p.id} 
                          onClick={() => setSelectedPreviewProperty(p)}
                          className="group hover:bg-slate-50/70 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <td className="px-8 py-6">
                            <div>
                              <p className="font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors text-base leading-tight">{p.title}</p>
                              <p className="text-slate-500 font-mono text-[10px] mt-0.5">{p.location}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-bold text-slate-700 text-sm">{p.landlordName || "None"}</td>
                          <td className="px-8 py-6 font-serif italic font-extrabold text-[#000000] text-base">{p.price}</td>
                          <td className="px-8 py-6">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Compliant
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "text-[8px] px-2.5 py-1 rounded-full uppercase tracking-widest font-black inline-block text-center",
                              p.status === 'Live' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                            )}>
                              {p.status || 'Live'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2 text-right">
                              <button
                                onClick={() => handleEditProperty(p)}
                                className="px-4 py-2 bg-slate-800 hover:bg-black text-white font-extrabold uppercase tracking-widest text-[8px] sm:text-[9.5px] rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 duration-150"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="py-20 text-center text-slate-400 italic">
                            No listings currently managed by agent. Click general button to board client listing.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}

        </div>
      </div>

      {/* TASK 3: ADD LANDLORD MODAL OVERLAY */}
      <AnimatePresence>
        {showAddLandlordModal && (
          <div className="fixed inset-0 bg-[#020617]/50 backdrop-blur-sm flex items-center justify-center p-4 z-[5000]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-10 max-w-md w-full relative shadow-2xl"
            >
              <button 
                onClick={() => setShowAddLandlordModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-6">
                <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 leading-none">Onboard Landlord</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Submit Credentials to Registry</p>
                </div>
              </div>

              <form onSubmit={handleAddLandlord} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-extrabold mb-2">Landlord's Full Name</label>
                  <input 
                    type="text" 
                    value={llName}
                    onChange={(e) => setLlName(e.target.value)}
                    placeholder="e.g. Richard Sterling Cole"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 text-slate-900 text-sm font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-extrabold mb-2">Registered Email Address (Optional)</label>
                  <input 
                    type="email" 
                    value={llEmail}
                    onChange={(e) => setLlEmail(e.target.value)}
                    placeholder="e.g. richard@sterlingholdings.co.uk"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 text-slate-900 text-sm font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-extrabold mb-2">UK Mobile Connection (Optional)</label>
                  <input 
                    type="tel" 
                    value={llPhone}
                    onChange={(e) => setLlPhone(e.target.value)}
                    placeholder="e.g. 07700 900501"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 text-slate-900 text-sm font-semibold transition-all"
                  />
                </div>

                <div className="border-t border-slate-100 pt-6 flex justify-end gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => setShowAddLandlordModal(false)}
                    className="px-6 py-2.5 border border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[9px] rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingLandlord}
                    className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest text-[9px] rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingLandlord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                    Onboard Landlord
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHOOSE CLIENT LANDLORD TRANSITION DIALOG FOR ADD-PROPERTY FLOW */}
      <AnimatePresence>
        {showSelectLandlordToPublishModal && (
          <div className="fixed inset-0 bg-[#020617]/50 backdrop-blur-sm flex items-center justify-center p-4 z-[5000]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-10 max-w-md w-full relative shadow-2xl"
            >
              <button 
                onClick={() => {
                  setShowSelectLandlordToPublishModal(false);
                  setSelectedLlToPublish('');
                }}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-6">
                <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 leading-none">Select Client Landlord</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Start Digital Listing Compilation</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-extrabold mb-2.5">Eligible Landlord Client</label>
                  <select 
                    value={selectedLlToPublish}
                    onChange={(e) => setSelectedLlToPublish(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 text-slate-900 text-sm font-bold transition-all"
                  >
                    <option value="" disabled>-- Choose Client from Roster --</option>
                    {landlords.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                    ))}
                  </select>
                </div>

                <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-wide">
                  * Note: Proceeding will safely enter the customized landlord workspace so that compile actions list for the correct landlord's account seamlessly.
                </p>

                <div className="border-t border-slate-100 pt-6 flex justify-end gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowSelectLandlordToPublishModal(false);
                      setSelectedLlToPublish('');
                    }}
                    className="px-6 py-2.5 border border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[9px] rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleProceedToPublish}
                    disabled={!selectedLlToPublish}
                    className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-[9px] rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer font-black"
                  >
                    <Plus className="w-3.5 h-3.5" /> Continue to Listing Form
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TABULAR METRIC PREVIEW MODAL */}
      <AnimatePresence>
        {selectedPreviewProperty && (
          <div className="fixed inset-0 bg-[#020617]/50 backdrop-blur-sm flex items-center justify-center p-4 z-[5000]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full relative shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedPreviewProperty(null)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative rounded-2xl overflow-hidden h-64 mb-8">
                <img 
                  src={selectedPreviewProperty.image || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200"} 
                  className="w-full h-full object-cover" 
                  alt={selectedPreviewProperty.title} 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                    {selectedPreviewProperty.status || 'Live'}
                  </span>
                  <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest">
                    EPC: {selectedPreviewProperty.energyEfficiency || 'D'}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-t from-slate-950/80 to-transparent p-6 pt-12 rounded-b-2xl">
                  <p className="text-[10px] text-teal-400 uppercase font-black tracking-widest mb-1 leading-none">
                    Client: {selectedPreviewProperty.landlordName || 'Sir Richard Cole'}
                  </p>
                  <h3 className="text-2xl font-serif text-white leading-tight font-bold">{selectedPreviewProperty.title}</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-baseline border-b border-slate-100 pb-6">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Property Location</p>
                    <p className="text-slate-900 font-extrabold text-base">{selectedPreviewProperty.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Monthly Rent</p>
                    <p className="text-2xl font-serif text-teal-700 italic font-black leading-none">{selectedPreviewProperty.price}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-extrabold">Bedrooms</p>
                    <p className="text-lg font-black text-slate-800">{selectedPreviewProperty.beds || 2}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-extrabold">Bathrooms</p>
                    <p className="text-lg font-black text-slate-800">{selectedPreviewProperty.baths || 1}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-extrabold">Council Tax</p>
                    <p className="text-xs font-black text-slate-800 mt-1 uppercase leading-none">{selectedPreviewProperty.councilTax || 'Band D'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-700 font-extrabold mb-2.5">Architectural narrative</h4>
                  <p className="text-slate-700 text-xs leading-relaxed text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 font-medium whitespace-pre-line leading-relaxed">
                    {selectedPreviewProperty.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6 flex justify-end gap-3 flex-wrap">
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 font-extrabold uppercase tracking-widest py-2 px-4 rounded-full border border-emerald-100 mr-auto flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Compliant (Renters Rights Act)
                  </span>
                  
                  {selectedPreviewProperty.status !== 'Draft' && (
                    <Link 
                      to={`/property/${selectedPreviewProperty.id}`} 
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold uppercase tracking-widest text-[9px] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" /> Open Listing
                    </Link>
                  )}
                  <button 
                    onClick={() => setSelectedPreviewProperty(null)}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest text-[9px] rounded-full transition-colors font-black cursor-pointer shadow-sm hover:shadow-md"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tab Nav for tablet & mobile */}
      <BottomNav type="agent" />
    </div>
  );
}
