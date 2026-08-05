import { motion, AnimatePresence } from 'motion/react';
import { Bed, Bath, Move, Heart, ChevronLeft, ChevronRight, Eye, Home, ShieldCheck, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import type { Property } from '../constants/mockData';
import { cn } from '../lib/utils';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';


interface PropertyCardProps {
  property: Property;
  onHover?: (id: string | null) => void;
  key?: string | number;
}

export default function PropertyCard({ property, onHover }: PropertyCardProps) {
  const { isSaved, toggleSave } = useSavedProperties();
  const { profile, user } = useAuth();
  const { showNotification } = useNotification();

  const handleCardClick = async () => {
    try {
      let visitorId = localStorage.getItem('hoe_visitor_id');
      if (!visitorId) {
        visitorId = 'vis_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('hoe_visitor_id', visitorId);
      }
      await addDoc(collection(db, 'propertyClicks'), {
        propertyId: property.id,
        propertyTitle: property.title || 'Untitled Property',
        landlordId: property.landlordId || 'unknown',
        visitorId,
        userId: user?.uid || null,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Silent click log failed:", err);
    }
  };

  const isLandlord = profile?.role === 'landlord' || profile?.role === 'both';
  const saved = isSaved(property.id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const totalImages = (property.image_urls && property.image_urls.length > 0)
    ? property.image_urls.filter(Boolean).length
    : (property.images ? property.images.filter(Boolean).length : 0);

  React.useEffect(() => {
    setCurrentImageIndex(0);
    setFailedImages({});
  }, [property.id]);
  
  // Cache buster guarantees the browser displays freshly replaced images instantly
  const cacheBuster = React.useMemo(() => Date.now(), []);
  const prepUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${cacheBuster}`;
  };

  const isLetAgreed = property.status === 'Let Agreed' && !isLandlord;
  // We want to show up to 3 real images, then a 4th "more" slide if there are 4+ images
  const displayImages = React.useMemo(() => {
    let list = (property.image_urls && property.image_urls.length > 0)
      ? [...property.image_urls]
      : (property.images ? [...property.images] : []);
    if (list.length === 0 && property.image) {
      list = [property.image];
    }
    const valid = list.filter(Boolean);
    if (isLetAgreed) {
      return valid.slice(0, 1).map(img => prepUrl(img));
    }
    return valid.slice(0, 4).map(img => prepUrl(img));
  }, [property.images, property.image_urls, property.image, isLetAgreed, prepUrl]);

  const hasMoreImages = !isLetAgreed && totalImages > 3;

  const nextImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={handleCardClick}
      className={cn(
        "group bg-white rounded-3xl overflow-hidden border border-border hover:shadow-2xl transition-all duration-700 cursor-pointer flex flex-col h-full",
        property.status === 'Let Agreed' && !isLandlord ? "opacity-90" : ""
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F0] touch-pan-y group/carousel">
        <Link to={`/property/${property.id}`} target="_blank" className="absolute inset-0 z-10">
          <AnimatePresence mode="popLayout" initial={false}>
            {displayImages.length > 0 ? (
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full relative cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(e, info) => {
                  const threshold = 50;
                  if (info.offset.x < -threshold) {
                    nextImage();
                  } else if (info.offset.x > threshold) {
                    prevImage();
                  }
                }}
              >
                {displayImages[currentImageIndex] && !failedImages[currentImageIndex] ? (
                  <>
                    <img 
                      src={displayImages[currentImageIndex]} 
                      alt={property.title}
                      onError={() => setFailedImages(prev => ({ ...prev, [currentImageIndex]: true }))}
                      className={cn(
                        "w-full h-full object-cover pointer-events-none transition-all duration-1000 group-hover:scale-105",
                        currentImageIndex === 3 && hasMoreImages ? "blur-md opacity-70" : ""
                      )}
                    />
                    
                    {/* EPC Overlays removed as requested */}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-secondary">
                    <Home className="w-12 h-12 text-primary/15 animate-pulse mb-2" />
                    <span className="text-[9px] font-bold text-primary/30 uppercase tracking-[0.1em]">No Image</span>
                  </div>
                )}
                
                {/* See More Overlay for 4th indicator slide */}
                {currentImageIndex === 3 && hasMoreImages && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[6px] flex flex-col items-center justify-center text-white">
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-transform group-hover:scale-110">
                      <Eye className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em]">See More</span>
                    <p className="text-[9px] opacity-90 mt-1 font-bold">+{totalImages - 3} OTHER VIEWS</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
                <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center overflow-hidden pointer-events-none">
                   <Home className="w-64 h-64 rotate-12" />
                </div>
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 border border-dashed border-primary/20 rounded-2xl animate-spin-slow"></div>
                  <Home className="w-10 h-10 text-primary/10" />
                </div>
                <div className="text-center relative">
                  <h4 className="text-primary/60 font-serif italic text-lg mb-1 font-bold uppercase tracking-tighter">No Image</h4>
                  <p className="text-primary/30 text-[9px] font-bold uppercase tracking-[0.2em] max-w-[140px] leading-relaxed mx-auto">
                    Visual audit in progress
                  </p>
                </div>
                <div className="mt-8 flex gap-2 items-center bg-primary/5 px-4 py-2 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
                  <span className="text-[8px] font-bold text-primary/40 uppercase tracking-[0.3em]">Live Feed Pending</span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </Link>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-3 opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-none z-30">
            <button 
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#0c0214]/75 border border-[#d4af37]/40 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_10px_rgba(212,175,55,0.4)] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 pointer-events-auto"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0c0214]/75 border border-[#d4af37]/40 text-[#D4AF37] hover:bg-[#0a2f1d] hover:border-[#D4AF37] hover:shadow-[0_0_10px_rgba(212,175,55,0.4)] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 pointer-events-auto"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Carousel Indicators */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {displayImages.map((_, idx) => (
              <div 
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  currentImageIndex === idx ? "bg-accent w-4" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}

        {property.status === 'Let Agreed' ? (
          <div className="absolute top-3 left-3 bg-[#0a2f1d]/95 backdrop-blur-md border border-[#D4AF37] text-[#D4AF37] text-[11px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-widest shadow-2xl z-20">
            Let Agreed
          </div>
        ) : (
          <div className="absolute top-3 left-3 bg-accent text-primary text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm z-20">
            Premium Listing
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <button 
            className="p-2 backdrop-blur-md rounded-full bg-white/20 text-white hover:bg-white hover:text-accent transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const link = `${window.location.origin}/property/${property.id}`;
              navigator.clipboard.writeText(link);
              showNotification('Property link copied to clipboard!', 'info');
            }}
          >
            <Share className="w-4 h-4" />
          </button>

          <button 
            className={cn(
              "p-2 backdrop-blur-md rounded-full transition-all duration-300",
              saved 
                ? "bg-accent text-primary" 
                : "bg-white/20 text-white hover:bg-white hover:text-accent"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(property.id);
            }}
          >
            <Heart className={cn("w-4 h-4", saved && "fill-current")} />
          </button>
        </div>
      </div>

      <Link to={`/property/${property.id}`} target="_blank" className="p-5 flex-grow flex flex-col">
        <div className="mb-2">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-accent font-bold text-xl">{property.price}</h3>
            {((!property.status || property.status === 'Live' || property.status === 'Let Agreed') ? true : isLandlord) && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-primary bg-primary/5 px-2 py-1 rounded-md">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  (!property.status || property.status === 'Live') ? "bg-[#4CAF50]" : 
                  property.status === 'Let Agreed' ? "bg-accent" : "bg-muted"
                )}></span> 
                {property.status || 'Live'}
              </div>
            )}
          </div>
          <p className="text-base font-serif text-black font-bold mb-1 line-clamp-1">{property.title}</p>
          <p className="text-[10px] text-muted uppercase tracking-widest font-bold flex items-center gap-2">
            <Bed className="w-3 h-3" /> {property.bedrooms} Beds <span className="text-accent">·</span> 
            <Bath className="w-3 h-3" /> {property.bathrooms} Baths <span className="text-accent">·</span>
            <span className="truncate">{property.location}</span>
          </p>
        </div>
        
        <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {property.councilTaxBand && (
               <div className="flex items-center gap-1.5">
                 <span className="text-[8px] font-black uppercase tracking-tighter opacity-40">Band</span>
                 <div className="w-5 h-5 rounded-full bg-primary text-secondary flex items-center justify-center text-[9px] font-black shadow-sm">
                   {property.councilTaxBand}
                 </div>
               </div>
             )}

          </div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            {property.isStudent ? "Student Approved" : "Verified"}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
