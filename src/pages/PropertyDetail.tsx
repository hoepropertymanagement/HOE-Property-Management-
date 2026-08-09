import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Heart, 
  Move, 
  Home, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MessageSquare, 
  Loader2, 
  MapPin, 
  Bed, 
  Bath, 
  CheckCircle2, 
  Ruler, 
  Download, 
  FileText 
} from 'lucide-react';
import { cn } from '../lib/utils'; // Adjust import path if your utility is elsewhere

// High quality fallback images if property has no images loaded
const DEFAULT_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80'
];

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Component state
  const [property, setProperty] = useState<any>(null);
  const [landlord, setLandlord] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  
  // Gallery & Lightbox states
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  
  // Modals & Action states
  const [showViewingModal, setShowViewingModal] = useState<boolean>(false);
  const [isMessaging, setIsMessaging] = useState<boolean>(false);

  // Helper function to prepare image URLs
  const prepUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url;
  };

  // Saved state helpers
  const isSaved = (propId: string) => savedProperties.includes(propId);
  const toggleSave = (propId: string) => {
    setSavedProperties((prev) =>
      prev.includes(propId) ? prev.filter((item) => item !== propId) : [...prev, propId]
    );
  };

  // Dummy action handlers
  const handleMessageLandlord = () => {
    setIsMessaging(true);
    setTimeout(() => {
      setIsMessaging(false);
      alert('Messaging console opened!');
    }, 600);
  };

  const handleViewingConfirm = () => {
    setShowViewingModal(false);
    alert('Viewing request submitted successfully!');
  };

  // Fetch or mock property data
  useEffect(() => {
    // Replace with your actual data fetching logic if needed
    setLoading(false);
    setProperty({
      id: id || '1',
      title: 'Luxury Modern Villa',
      location: '123 Eden Way, Kensington, London',
      price: '£3,500 pcm',
      bedrooms: 4,
      bathrooms: 3,
      type: 'Detached',
      councilTaxBand: 'G',
      description: 'A stunning architectural masterpiece offering high-end interior finishes, spacious living quarters, and direct private garden access.',
      isBillsIncluded: true,
      billsDescription: 'Water, High-speed Internet & Council Tax included',
      hasParking: true,
      hasGarden: true,
      isStudent: false,
      status: 'Available',
      landlordName: 'House of Eden Management',
      image: '',
      image_urls: [],
      images: []
    });
  }, [id]);

  // Compile images list for the Carousel viewer
  const carouselImages = useMemo(() => {
    if (!property) return DEFAULT_PROPERTY_IMAGES;
    
    const isLetAgreed = property.status === 'Let Agreed';
    const imagesList: string[] = [];

    if (property.image && property.image.trim()) {
      imagesList.push(prepUrl(property.image));
    }
    
    const rawImagesList = (property.image_urls && property.image_urls.length > 0)
      ? property.image_urls
      : property.images;

    if (!isLetAgreed && rawImagesList && Array.isArray(rawImagesList)) {
      rawImagesList.forEach((img: string) => {
        if (img && img.trim()) {
          const u = prepUrl(img);
          if (u && !imagesList.includes(u)) {
            imagesList.push(u);
          }
        }
      });
    }

    return imagesList.length > 0 ? imagesList : DEFAULT_PROPERTY_IMAGES;
  }, [property]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary text-primary">
        <h2 className="text-2xl font-serif font-bold mb-4">Property Not Found</h2>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-2 bg-accent text-white font-bold rounded-full"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 pb-20">
      {/* Top Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between pb-4 border-b border-primary/10">
          <button 
            onClick={() => navigate(-1)} 
            className="text-xs font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
          >
            &larr; Back to Listings
          </button>
          <div className="flex items-center gap-4">
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
        {/* Image Carousel */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden group/carousel shadow-2xl mb-12 bg-[#F5F5F0] border border-primary/5">
          {carouselImages.length > 0 ? (
            <div className="w-full h-full relative">
              {/* Active Image */}
              {!failedImages[carouselIndex] ? (
                <div 
                  className="w-full h-full cursor-zoom-in relative group/image"
                  onClick={() => { setLightboxIndex(carouselIndex); setIsLightboxOpen(true); }}
                >
                  <img 
                    src={carouselImages[carouselIndex]} 
                    alt={`${property.title} - View ${carouselIndex + 1}`} 
                    onError={() => setFailedImages(prev => ({ ...prev, [carouselIndex]: true }))}
                    className="w-full h-full object-cover transition-all duration-700 select-none animate-fade-in group-hover/image:scale-[1.02]"
                  />
                  <div className="absolute top-4 right-4 bg-black/45 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white/15 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-accent" />
                    Click to Expand
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-secondary gap-3">
                  <Home className="w-16 h-16 text-primary/15 animate-pulse" />
                  <span className="text-xs font-bold text-primary/30 uppercase tracking-[0.15em]">Image Not Available</span>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

              {/* Navigation Arrows */}
              {carouselImages.length > 1 && (
                <>
                  <button 
                    onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
                    className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 bg-[#0c0214]/80 border border-[#d4af37]/40 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-20 hover:scale-105 pointer-events-auto"
                    aria-label="Previous view"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                  </button>
                  <button 
                    onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselImages.length)}
                    className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 bg-[#0c0214]/80 border border-[#d4af37]/40 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-20 hover:scale-105 pointer-events-auto"
                    aria-label="Next view"
                  >
                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                  </button>
                </>
              )}

              {/* Carousel Dots */}
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

              {/* Status & Counter Badges */}
              {property.status === 'Let Agreed' ? (
                <div className="absolute top-6 left-6 bg-[#0a2f1d]/95 backdrop-blur-md border-2 border-[#D4AF37] text-[#D4AF37] text-sm font-black px-5 py-3 rounded-2xl uppercase tracking-[0.2em] shadow-2xl z-30">
                  Let Agreed
                </div>
              ) : (
                carouselImages.length > 1 && (
                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest border border-white/10 select-none">
                    View {carouselIndex + 1} of {carouselImages.length}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative p-8 bg-white border border-primary/5">
              <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 relative">
                <Home className="w-10 h-10 text-primary/10" />
              </div>
              <div className="text-center">
                <h4 className="text-primary/60 font-serif italic text-xl mb-1 font-bold uppercase tracking-tighter">No Images Available</h4>
                <p className="text-primary/30 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[180px] leading-relaxed mx-auto">
                  A visual audit of this property is currently pending
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top Feature Bar - Monthly Rent */}
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
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3 md:gap-4">
            {property.status === 'Let Agreed' ? (
              <>
                <button 
                  disabled
                  className="w-full sm:w-auto px-8 py-4 bg-gray-500/20 text-gray-400 rounded-full font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-white/5 opacity-60"
                >
                  <Calendar className="w-4 h-4" />
                  Bookings Closed
                </button>
                <button 
                  disabled
                  className="w-full sm:w-auto px-8 py-4 bg-gray-500/10 text-gray-400 rounded-full font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-white/5 opacity-60"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messaging Disabled
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setShowViewingModal(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-accent text-secondary rounded-full font-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  Book a Viewing
                </button>
                <button 
                  onClick={handleMessageLandlord}
                  disabled={isMessaging}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 text-secondary rounded-full font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  {isMessaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Message Landlord
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Content Details Split */}
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
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif italic mb-4">{property.title}</h1>
              <div className="flex items-center gap-2 text-primary/60 mb-8">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-lg">{property.location}</span>
              </div>

              {/* Key Specs */}
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

              {/* Description */}
              <div className="mb-12">
                <h3 className="text-2xl font-serif italic mb-4">Property Description</h3>
                <div className="text-primary/80 leading-relaxed space-y-4">
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

              {/* Features */}
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

              {/* Floor Plan */}
              {property.floorplan && (
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
              )}

              {/* EPC Certificate */}
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
                  <div className="p-10 bg-secondary/30 rounded-[2rem] border border-primary/5 flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-primary/20 mb-3" />
                    <p className="text-primary/70 text-sm font-bold tracking-tight">EPC Pending / Not Provided</p>
                    <p className="text-[10px] text-primary/40 uppercase tracking-widest mt-1.5 leading-relaxed max-w-xs font-semibold">
                      Energy performance verification details for this property are currently pending.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Landlord Card Sidebar */}
          <div className="lg:col-start-3">
            <div className="sticky top-40 bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-4 pb-4 border-b border-primary/5">
                <div>
                  <span className="text-[9px] text-accent uppercase tracking-[0.25em] font-bold block mb-1">Assigned Listing Owner</span>
                  <h4 className="font-serif italic text-2xl font-bold leading-tight text-primary">
                    {landlord?.username || landlord?.name || property.landlordName || 'Verified Landlord'}
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest mt-4">
                Available Online
              </p>
              <p className="text-xs text-primary/50 mt-1">
                To start verification or secure a viewing slot, please use the main premium message and booking console at the top.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-[#0c0214]/98 backdrop-blur-[12px] flex flex-col justify-between p-6 select-none"
          >
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto py-2 z-10">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37] italic">
                Viewing {lightboxIndex + 1} of {carouselImages.length}
              </span>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-[#0a2f1d] hover:text-accent border border-white/10 hover:border-[#D4AF37]/50 text-white flex items-center justify-center transition-all duration-300 font-bold text-[#D4AF37] text-2xl cursor-pointer hover:scale-105"
                aria-label="Close Lightbox"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center w-full max-w-6xl mx-auto relative px-4">
              {carouselImages.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
                  className="absolute left-0 sm:left-4 bg-[#0c0214]/80 border border-[#d4af37]/45 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 z-20 font-bold"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                src={carouselImages[lightboxIndex]}
                alt={`${property.title} - Full size view ${lightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-3xl border border-white/10 shadow-2xl select-none"
              />

              {carouselImages.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % carouselImages.length)}
                  className="absolute right-0 sm:right-4 bg-[#0c0214]/80 border border-[#d4af37]/45 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 z-20 font-bold"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>

            {carouselImages.length > 1 && (
              <div className="w-full max-w-4xl mx-auto overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-accent">
                <div className="flex gap-4 justify-center items-center px-4 min-w-max mx-auto py-2">
                  {carouselImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className={cn(
                        "w-20 aspect-[16/10] sm:w-24 rounded-2xl overflow-hidden border-2 p-0 transition-all duration-300 cursor-pointer focus:outline-none hover:opacity-100 flex-shrink-0",
                        lightboxIndex === idx 
                          ? "border-[#D4AF37] scale-105 ring-2 ring-accent/30 opacity-100 shadow-lg"
                          : "border-transparent opacity-40 hover:border-white/20"
                      )}
                      aria-label={`Jump to image ${idx + 1}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover select-none" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}