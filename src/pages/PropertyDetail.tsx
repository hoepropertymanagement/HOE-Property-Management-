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
import { useState, useEffect, useMemo } from 'react';
import EnquiryForm from '../components/EnquiryForm';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Property } from '../constants/mockData';
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
        if (docSnap.exists()) {
          const propData = { id: docSnap.id, ...docSnap.data() } as Property;
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
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

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
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', user.uid),
        where('propertyId', '==', property.id)
      );

      const snapshot = await getDocs(q);
      let conversationId = '';

      const existingConvo = snapshot.docs.find(doc => 
        doc.data().participantIds.includes(property.landlordId)
      );

      if (existingConvo) {
        conversationId = existingConvo.id;
      } else {
        // Create new conversation
        const convoData = {
          participantIds: [user.uid, property.landlordId],
          propertyId: property.id,
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'conversations'), convoData);
        conversationId = docRef.id;
      }

      navigate(`/dashboard/tenant/messages?id=${conversationId}`);
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
                    <div className="p-6 bg-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-accent" />
                        <span className="text-sm font-bold text-primary">Official EPC Document</span>
                      </div>
                      <a href={prepUrl(property.epcCertificate)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest hover:underline">
                        <Download className="w-4 h-4" /> Download Certificate
                      </a>
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

          {/* Landlord Card - Displays Landlord profile with public contact details & copy-to-clipboard */}
          <div className="lg:col-start-3">
            <div className="sticky top-40 bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent uppercase font-serif text-lg font-bold">
                  {(landlord?.username || landlord?.name || property.landlordName || 'L').charAt(0)}
                </div>
                <div>
                  <h4 className="font-serif italic text-lg leading-tight text-primary">
                    {landlord?.username || landlord?.name || property.landlordName || 'Verified Landlord'}
                  </h4>
                  <p className="text-primary/50 text-xs">
                    {landlord?.role || 'Private Landlord'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-10">
                {/* Email (Conditional on landlord.showEmail) */}
                {landlord?.showEmail && landlord?.email ? (
                  <div 
                    onClick={() => handleCopy(landlord.email, 'email')}
                    className="flex items-center justify-between gap-3 p-3 bg-secondary hover:bg-accent/5 rounded-xl border border-primary/5 cursor-pointer transition-all group"
                    title="Click to copy email"
                  >
                    <div className="flex items-center gap-3 text-primary/70 text-sm font-medium overflow-hidden">
                      <Mail className="w-4 h-4 text-accent shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="truncate">{landlord.email}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-accent shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">Copy</span>
                  </div>
                ) : null}

                {/* Phone (Conditional on landlord.showPhoneNumber) */}
                {landlord?.showPhoneNumber && (landlord?.phoneNumber || property.contactNumber) ? (
                  <div 
                    onClick={() => handleCopy(landlord?.phoneNumber || property.contactNumber, 'phone')}
                    className="flex items-center justify-between gap-3 p-3 bg-secondary hover:bg-accent/5 rounded-xl border border-primary/5 cursor-pointer transition-all group"
                    title="Click to copy phone"
                  >
                    <div className="flex items-center gap-3 text-primary/70 text-sm font-medium overflow-hidden">
                      <Phone className="w-4 h-4 text-accent shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="truncate">{landlord?.phoneNumber || property.contactNumber}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-accent shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">Copy</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-3 p-3 text-primary/70 text-sm font-medium">
                  <Info className="w-4 h-4 text-accent" />
                  <span>Ref: {property.referenceNumber || property.encodedUniqueNumber}</span>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/5 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Verified Landlord</span>
                </div>
                <p className="text-xs text-primary/60 italic leading-tight">This landlord has successfully completed identity verification.</p>
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
