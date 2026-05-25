import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Bed, Bath, Move, MapPin, Share2, Heart, 
  ChevronLeft, ChevronRight, Info, Calendar, Phone, Mail,
  CheckCircle2, Ruler, Home, MessageSquare, Loader2,
  FileText, Download
} from 'lucide-react';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect, useMemo } from 'react';
import EnquiryForm from '../components/EnquiryForm';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Property, mockProperties } from '../constants/mockData';
import { useNotification } from '../context/NotificationContext';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [landlord, setLandlord] = useState<any | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSave } = useSavedProperties();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [isMessaging, setIsMessaging] = useState(false);

  // Cache buster guarantees the browser displays freshly replaced images instantly
  const cacheBuster = useMemo(() => Date.now(), []);
  const prepUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${cacheBuster}`;
  };

  // Compile images list for the Carousel viewer
  const carouselImages = useMemo(() => {
    if (!property) return [];
    const imagesList: string[] = [];
    if (property.image) {
      imagesList.push(prepUrl(property.image));
    }
    if (property.images && Array.isArray(property.images)) {
      property.images.forEach((img: string) => {
        const u = prepUrl(img);
        if (u && !imagesList.includes(u)) {
          imagesList.push(u);
        }
      });
    }
    return imagesList;
  }, [property, prepUrl]);

  // Landlord public contact copy to clipboard functionality
  const handleCopy = async (text: string, type: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(`${type === 'email' ? 'Email address' : 'Phone number'} copied to clipboard!`, 'gold');
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      showNotification("Failed to copy. Please try selecting the text manually.", "red");
    }
  };

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        let propData: Property | null = null;

        if (docSnap.exists()) {
          propData = { id: docSnap.id, ...docSnap.data() } as Property;
        } else {
          try {
            const { data: sbProp, error: sbError } = await supabase
              .from('properties')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            if (!sbError && sbProp) {
              propData = {
                id: sbProp.id,
                title: sbProp.title || sbProp.name || 'Untitled Property',
                description: sbProp.description || '',
                image: sbProp.image || sbProp.image_url || '',
                images: sbProp.images || [],
                price: typeof sbProp.price === 'number' ? `£${sbProp.price.toLocaleString()}` : (sbProp.price || ''),
                beds: sbProp.beds || sbProp.bedrooms || 0,
                bedrooms: sbProp.beds || sbProp.bedrooms || 0,
                baths: sbProp.baths || sbProp.bathrooms || 0,
                bathrooms: sbProp.baths || sbProp.bathrooms || 0,
                status: sbProp.status || 'Draft',
                landlordId: sbProp.landlord_id || '',
                views: sbProp.views || 0,
                contactNumber: sbProp.contact_number || '',
                councilTax: sbProp.council_tax || 'Band A',
                energyEfficiency: sbProp.energy_efficiency || 'E',
                environmentalImpact: sbProp.environmental_impact || 'E',
                location: sbProp.location || '',
                lat: typeof sbProp.lat === 'number' ? sbProp.lat : undefined,
                lng: typeof sbProp.lng === 'number' ? sbProp.lng : undefined,
              } as unknown as Property;
            }
          } catch (sbErr) {
            console.warn("Silent Supabase fetch error in details:", sbErr);
          }
        }

        if (propData) {
          setProperty(propData);

          // Fetch landowner profile
          if (propData.landlordId) {
            try {
              const landlordRef = doc(db, 'users', propData.landlordId);
              const landlordSnap = await getDoc(landlordRef);
              if (landlordSnap.exists()) {
                setLandlord(landlordSnap.data());
              }
            } catch (landlordError) {
              console.warn("Silent landlord fetch failed:", landlordError);
            }
          }

          // Record a real-time property view event
          if (propData.landlordId) {
            try {
              const { collection, addDoc } = await import('firebase/firestore');
              await addDoc(collection(db, 'propertyViews'), {
                propertyId: id,
                propertyTitle: propData.title || 'Untitled Property',
                landlordId: propData.landlordId,
                timestamp: new Date().toISOString()
              });
            } catch (viewError) {
              console.error("Silent view log failed:", viewError);
            }
          }

          // Trigger Supabase RPC views counter increment (TASK 4)
          try {
            const { error: rpcErr } = await supabase.rpc('increment_property_views', { 
              property_id: id 
            });
            if (rpcErr) {
              console.warn("Supabase view increment RPC minor error:", rpcErr.message);
            } else {
              console.log("Supabase view counter incremented via RPC.");
            }
          } catch (sbErr) {
            console.warn("Silent Supabase views increment fallback:", sbErr);
          }
        } else {
          // Fallback to system-defined mock properties in memory
          const mockProp = mockProperties.find(p => p.id === id);
          if (mockProp) {
            setProperty(mockProp);
            setLandlord({
              name: "Alexandra Eden",
              bio: "Co-founder of HOE Property Management & House of Eden. Committed to providing premium and transparent listings for all tenants.",
              contactNumber: mockProp.contactNumber || "07700 900077",
              photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
              isPublicContact: true,
              showPhoneNumber: true,
              role: "landlord",
              isPhoneVerified: true
            });
          }
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        // Fallback in case of database connectivity issues
        const mockProp = mockProperties.find(p => p.id === id);
        if (mockProp) {
          setProperty(mockProp);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  // Dynamic SEO Metadata Injection for Property Titles, Prices, Locations & UK Rental Search Keywords
  useEffect(() => {
    if (!property) return;

    // Save previous document title to restore on unmount
    const prevTitle = document.title;
    
    // Create new SEO Title: e.g., "3 Bed Flat in Hatfield - £1,200/mo | HOE Property Management"
    const bedsText = property.beds ? `${property.beds} Bed ` : '';
    const titleText = `${bedsText}${property.title} in ${property.location || 'UK'} - ${property.price} | HOE Property Management`;
    document.title = titleText;

    // Helper function to safely update or append meta tags in document head
    const updateMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Clean description text for search snippets
    const cleanDesc = property.description
      ? property.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
      : `Stunning ${bedsText}${property.title || 'Property'} available for rent in ${property.location || 'UK'}. Explore live pricing, virtual details, council tax bands, EPC rating, and book a viewing with HOE Property Management.`;

    // 1. General Search Engine Optimization
    updateMetaTag('name', 'description', cleanDesc);
    updateMetaTag('name', 'keywords', `${property.location || 'UK'} rental sites, property for rent in ${property.location || 'UK'}, UK lettings agency, student flat, shared housing, buy property, house of eden, hoe property management, EPC verified landlords`);
    
    // 2. OpenGraph Protocols (for Social Sharing e.g. Facebook, LinkedIn, iMessage, WhatsApp)
    updateMetaTag('property', 'og:title', titleText);
    updateMetaTag('property', 'og:description', cleanDesc);
    updateMetaTag('property', 'og:image', property.image || '');
    updateMetaTag('property', 'og:url', window.location.href);
    updateMetaTag('property', 'og:type', 'website');

    // 3. Twitter Cards for dynamic social sharing previews
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', titleText);
    updateMetaTag('name', 'twitter:description', cleanDesc);
    updateMetaTag('name', 'twitter:image', property.image || '');

    // Restore previous title on component update or unmount
    return () => {
      document.title = prevTitle;
    };
  }, [property]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-primary/50 text-sm uppercase tracking-widest font-bold italic">Loading Property Details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-serif mb-4 italic">Property Not Found</h2>
        <Link to="/search" className="text-accent underline">Back to Search</Link>
      </div>
    );
  }

  const handleMessageLandlord = async () => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/property/${property.id}` } } });
      return;
    }

    if (!property.landlordId) return;

    setIsMessaging(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_property_id: property.id,
        p_participant_1: user.uid,
        p_participant_2: property.landlordId,
        p_created_by: user.uid // The user initiating the chat
      });

      if (error) {
        console.error("Error from get_or_create_conversation RPC:", error);
        throw error;
      }

      const conversationId = data?.[0]?.conversation_id ?? data?.conversation_id ?? data;

      if (conversationId) {
        navigate(`/dashboard/tenant/messages?id=${conversationId}`);
      } else {
        console.warn("No conversation ID returned from RPC");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setIsMessaging(false);
    }
  };

  return (
    <div className="bg-secondary min-h-screen pb-24">
      {/* Detail Navbar (Hidden on mobile) */}
      <div className="bg-white/50 backdrop-blur-md border-b border-primary/5 py-4 sticky top-20 z-40 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/search" className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" />
            Back to Search
          </Link>
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-primary/60 hover:text-accent transition-colors text-sm font-medium">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button 
              onClick={() => toggleSave(property.id)}
              className={cn(
                "flex items-center gap-2 transition-colors text-sm font-medium focus:outline-none",
                isSaved(property.id) ? "text-accent" : "text-primary/60 hover:text-accent"
              )}
            >
              <Heart className={cn("w-4 h-4", isSaved(property.id) && "fill-current")} />
              {isSaved(property.id) ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Carousel: Interactive viewer with left/right arrows */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden group/carousel shadow-2xl mb-12 bg-[#F5F5F0] border border-primary/5">
          {carouselImages.length > 0 ? (
            <div className="w-full h-full relative">
              {/* Active Image */}
              <img 
                src={carouselImages[carouselIndex]} 
                alt={`${property.title} - View ${carouselIndex + 1}`} 
                className="w-full h-full object-cover transition-all duration-700 select-none animate-fade-in"
              />

              {/* Gradient overlay for text reading */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

              {/* Left/Right Arrows */}
              {carouselImages.length > 1 && (
                <>
                  <button 
                    onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#0c0214]/80 border border-[#d4af37]/40 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-20 hover:scale-105 pointer-events-auto"
                    aria-label="Previous view"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselImages.length)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-[#0c0214]/80 border border-[#d4af37]/40 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-20 hover:scale-105 pointer-events-auto"
                    aria-label="Next view"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Carousel Dots Indicators */}
              {carouselImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  {carouselImages.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-300 border-0 p-0 cursor-pointer",
                        carouselIndex === idx ? "bg-accent scale-110 w-6" : "bg-white/50 hover:bg-white"
                      )}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Number/Count Indicator */}
              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest border border-white/10 select-none">
                View {carouselIndex + 1} of {carouselImages.length}
              </div>

              {/* EPC Badges */}
              <div className="absolute top-6 right-6 flex gap-2 z-10">
                {property.epcEE && (
                  <div className={cn(
                    "w-10 h-10 flex flex-col items-center justify-center text-white font-black rounded-xl text-sm shadow-xl border border-white/20 select-none",
                    property.epcEE === 'A' ? "bg-green-600/90" : 
                    property.epcEE === 'B' ? "bg-green-500/90" :
                    property.epcEE === 'C' ? "bg-lime-500/90" :
                    property.epcEE === 'D' ? "bg-yellow-500/90" : "bg-orange-500/90"
                  )}>
                    <span className="text-[6px] uppercase tracking-tighter opacity-75">EE</span>
                    {property.epcEE}
                  </div>
                )}
                {property.epcEI && (
                  <div className={cn(
                    "w-10 h-10 flex flex-col items-center justify-center text-white font-black rounded-xl text-sm shadow-xl border border-white/20 select-none",
                    property.epcEI === 'A' ? "bg-green-600/90" : 
                    property.epcEI === 'B' ? "bg-green-500/90" :
                    property.epcEI === 'C' ? "bg-lime-500/90" :
                    property.epcEI === 'D' ? "bg-yellow-500/90" : "bg-orange-500/90"
                  )}>
                    <span className="text-[6px] uppercase tracking-tighter opacity-75">EI</span>
                    {property.epcEI}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative p-8 bg-white border border-primary/5">
              <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center overflow-hidden pointer-events-none">
                 <Home className="w-64 h-64 rotate-12" />
              </div>
              <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 relative">
                <Home className="w-10 h-10 text-primary/10" />
              </div>
              <div className="text-center">
                <h4 className="text-primary/60 font-serif italic text-xl mb-1 font-bold uppercase tracking-tighter">No Images Available</h4>
                <p className="text-primary/30 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[180px] leading-relaxed mx-auto">
                  A visual audit of this premium property is currently pending
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top Feature Bar - Monthly Rent at Top */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary p-6 md:p-8 rounded-[2rem] text-secondary shadow-xl shadow-primary/10 mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent mb-2 block">Monthly Rent</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold">{property.price.split(' ')[0]}</span>
              <span className="text-accent/80 text-base md:text-lg">{property.price.split(' ')[1]}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
             <button className="px-8 py-4 bg-accent text-secondary rounded-full font-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <Calendar className="w-4 h-4" />
                Book a Viewing
              </button>
              <button 
                onClick={handleMessageLandlord}
                disabled={isMessaging}
                className="px-8 py-4 bg-white/10 text-secondary rounded-full font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {isMessaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Message Landlord
              </button>
          </div>
        </motion.div>

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="mb-10">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="px-4 py-1.5 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Featured
                </span>
                <span className="px-4 py-1.5 bg-primary text-secondary text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Available Now
                </span>
                {property.isStudent && (
                   <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Student Friendly
                   </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-serif italic mb-4">{property.title}</h1>
              <div className="flex items-center gap-2 text-primary/60 mb-8">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-lg">{property.location}</span>
                <button className="ml-2 text-accent underline text-sm font-medium">View on Map</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 mb-10">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">Bedrooms</span>
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-accent" />
                    <p className="text-xl font-bold text-primary">{property.bedrooms}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center border-l border-primary/5">
                  <span className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">Bathrooms</span>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-accent" />
                    <p className="text-xl font-bold text-primary">{property.bathrooms}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center border-l border-primary/5">
                  <span className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">Type</span>
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-accent" />
                    <p className="text-xl font-bold text-primary">{property.type}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center border-l border-primary/5">
                  <span className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">Council Tax</span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary text-secondary flex items-center justify-center text-xs font-black">
                      {property.councilTaxBand || 'N/A'}
                    </div>
                    <p className="text-xl font-bold text-primary">Band {property.councilTaxBand || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-serif italic">Property Description</h3>
                  <div className="flex items-center gap-4">
                    {property.epcEE && (
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-primary/30 tracking-tighter">EPC EE</span>
                        <div className={cn(
                          "w-8 h-8 flex items-center justify-center text-white font-black rounded-lg text-sm",
                          property.epcEE === 'A' ? "bg-green-600" : 
                          property.epcEE === 'B' ? "bg-green-500" :
                          property.epcEE === 'C' ? "bg-lime-500" :
                          property.epcEE === 'D' ? "bg-yellow-500" : "bg-orange-500"
                        )}>
                          {property.epcEE}
                        </div>
                      </div>
                    )}
                    {property.epcEI && (
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-primary/30 tracking-tighter">EPC EI</span>
                        <div className={cn(
                          "w-8 h-8 flex items-center justify-center text-white font-black rounded-lg text-sm",
                          property.epcEI === 'A' ? "bg-green-600" : 
                          property.epcEI === 'B' ? "bg-green-500" :
                          property.epcEI === 'C' ? "bg-lime-500" :
                          property.epcEI === 'D' ? "bg-yellow-500" : "bg-orange-500"
                        )}>
                          {property.epcEI}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="markdown-body text-primary/80 leading-relaxed space-y-4">
                  <p>{property.description}</p>
                  {property.isBillsIncluded && (
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-accent italic">Bills Included</p>
                        <p className="text-sm font-medium text-primary/60">{property.billsDescription}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-2xl font-serif italic mb-6">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    property.hasParking ? "Allocated Parking" : null,
                    property.hasGarden ? "Private Garden" : null,
                    "Private Rooftop Terrace",
                    "Underfloor Heating Throughout",
                    "Energy Efficient Appliances",
                  ].filter(Boolean).map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-primary/5">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                      <span className="text-sm font-medium text-primary/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {property.floorplan ? (
                <div className="mb-12">
                  <h3 className="text-2xl font-serif italic mb-6">Floor Plan</h3>
                  <div className="bg-white rounded-[2rem] border border-primary/5 shadow-xl overflow-hidden group">
                    <img src={prepUrl(property.floorplan)} className="w-full h-auto" alt="Floor Plan" />
                    <div className="p-6 bg-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Ruler className="w-5 h-5 text-accent" />
                        <span className="text-sm font-bold text-primary">Technical Floor Plan</span>
                      </div>
                      <a href={prepUrl(property.floorplan)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest hover:underline">
                        <Download className="w-4 h-4" /> View Full Scale
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* EPC Certificate Display */}
              <div className="mb-12">
                <h3 className="text-2xl font-serif italic mb-6">Energy Performance Certificate (EPC)</h3>
                {property.epcCertificate ? (
                  <div className="bg-white rounded-[2rem] border border-primary/5 shadow-xl overflow-hidden group">
                    <img src={prepUrl(property.epcCertificate)} className="w-full h-auto" alt="EPC Certificate" />
                    <div className="p-6 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-accent" />
                        <span className="text-sm font-bold text-primary">Official EPC Document</span>
                      </div>
                    </div>
                  </div>
                ) : (
                   <div className="p-8 bg-white rounded-[2rem] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center text-center">
                     <FileText className="w-12 h-12 text-primary/10 mb-4" />
                     <p className="text-primary/40 text-sm font-medium italic">No digital EPC certificate attached to this listing.</p>
                     <p className="text-[10px] text-primary/30 uppercase tracking-widest mt-2">EE Rating: {property.epcEE || 'N/A'} | EI Rating: {property.epcEI || 'N/A'}</p>
                   </div>
                )}
              </div>

              <div className="mt-16">
                <EnquiryForm />
              </div>
            </div>
          </div>

          {/* Landlord Card - Simplified to show only the Landlord Name */}
          <div className="lg:col-start-3">
            <div className="sticky top-40 bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-primary/5">
                <div>
                  <span className="text-[9px] text-accent uppercase tracking-[0.25em] font-bold block mb-1">Assigned Listing Owner</span>
                  <h4 className="font-serif italic text-2xl font-bold leading-tight text-primary">
                    {landlord?.username || landlord?.name || property.landlordName || 'Verified Landlord'}
                  </h4>
                </div>
              </div>

              <div className="space-y-4">
                 <button className="w-full py-4 bg-primary text-secondary rounded-full font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                   <Calendar className="w-4 h-4" />
                   Book a Viewing
                 </button>
                 <button 
                  onClick={handleMessageLandlord}
                  disabled={isMessaging}
                  className="w-full py-4 bg-accent text-secondary rounded-full font-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                  {isMessaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Chat with Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
