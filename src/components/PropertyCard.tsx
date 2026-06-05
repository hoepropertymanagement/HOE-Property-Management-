import { motion, AnimatePresence } from 'motion/react';
import { Bed, Bath, Move, Heart, ChevronLeft, ChevronRight, Eye, Home, ShieldCheck, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import type { Property } from '../constants/mockData';
import { cn } from '../lib/utils';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';


interface PropertyCardProps {
  property: Property;
  onHover?: (id: string | null) => void;
  key?: string | number;
}

export default function PropertyCard({ property, onHover }: PropertyCardProps) {
  const { isSaved, toggleSave } = useSavedProperties();
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  const isLandlord = profile?.role === 'landlord' || profile?.role === 'both';
  const saved = isSaved(property.id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const totalImages = property.images?.length || 0;
  
  // Cache buster guarantees the browser displays freshly replaced images instantly
  const cacheBuster = React.useMemo(() => Date.now(), []);
  const prepUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${cacheBuster}`;
  };

  // We want to show up to 3 real images, then a 4th "more" slide if there are 4+ images
  const displayImages = property.images ? property.images.slice(0, 4).map(img => prepUrl(img)) : [];
  const hasMoreImages = totalImages > 3;

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
      className={cn(
        "group bg-white rounded-3xl overflow-hidden border border-border hover:shadow-2xl transition-all duration-700 cursor-pointer flex flex-col h-full",
        property.status === 'Let Agreed' && !isLandlord ? "opacity-70 grayscale-[20%]" : ""
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F0] touch-pan-y group/carousel">
        <Link to={`/property/${property.id}`} className={cn("absolute inset-0 z-10", property.status === 'Let Agreed' && !isLandlord ? "pointer-events-none" : "")}>
          {property.status === 'Let Agreed' && (
            <div className="absolute inset-0 z-40 bg-[#0a2f1d]/50 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
              <div className="bg-accent text-primary px-6 py-3 rounded-full font-black uppercase tracking-[0.3em] shadow-2xl border-2 border-primary/20 transform -rotate-12 scale-110">
                Let Agreed
              </div>
            </div>
          )}
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
                {displayImages[currentImageIndex] ? (
                  <>
                    <img 
                      src={displayImages[currentImageIndex]} 
                      alt={property.title}
                      className={cn(
                        "w-full h-full object-cover pointer-events-none transition-all duration-1000 group-hover:scale-105",
                        currentImageIndex === 3 && hasMoreImages ? "blur-md opacity-70" : ""
                      )}
                    />
                    
                    {/* EPC Overlays */}
                    <div className="absolute top-12 left-3 flex flex-col gap-1 z-20">
                      {property.epcEE && (
                        <div className={cn(
                          "w-7 h-7 flex flex-col items-center justify-center text-white font-black rounded-lg text-[10px] shadow-lg border border-white/20",
                          property.epcEE === 'A' ? "bg-green-600" : 
                          property.epcEE === 'B' ? "bg-green-500" :
                          property.epcEE === 'C' ? "bg-lime-500" :
                          property.epcEE === 'D' ? "bg-yellow-500" : "bg-orange-500"
                        )}>
                          <span className="text-[5px] uppercase opacity-70 leading-[1]">EE</span>
                          {property.epcEE}
                        </div>
                      )}
                      {property.epcEI && (
                        <div className={cn(
                          "w-7 h-7 flex flex-col items-center justify-center text-white font-black rounded-lg text-[10px] shadow-lg border border-white/20",
                          property.epcEI === 'A' ? "bg-green-600" : 
                          property.epcEI === 'B' ? "bg-green-500" :
                          property.epcEI === 'C' ? "bg-lime-500" :
                          property.epcEI === 'D' ? "bg-yellow-500" : "bg-orange-500"
                        )}>
                          <span className="text-[5px] uppercase opacity-70 leading-[1]">EI</span>
                          {property.epcEI}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-secondary">
                    <Home className="w-8 h-8 text-primary/10" />
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
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse"></div>
                  <span className="text-[8px] font-bold text-primary/40 uppercase tracking-[0.3em]">Live Feed Pending</span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </Link>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-none z-30">
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

        <div className="absolute top-3 left-3 bg-accent text-primary text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">
          Premium Listing
        </div>

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

      <Link to={`/property/${property.id}`} className={cn("p-5 flex-grow flex flex-col", property.status === 'Let Agreed' && !isLandlord ? "pointer-events-none" : "")}>
        <div className="mb-2">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-accent font-bold text-xl">{property.price}</h3>
            {((!property.status || property.status === 'Live' || property.status === 'Let Agreed') ? true : isLandlord) && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-primary bg-primary/5 px-2 py-1 rounded-md">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  (!property.status || property.status === 'Live') ? "bg-[#4CAF50] animate-pulse" : 
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
             {property.epcEE && (
               <div className={cn(
                 "px-1.5 py-0.5 rounded-sm text-white text-[8px] font-black shadow-sm",
                 ['A', 'B', 'C'].includes(property.epcEE) ? "bg-green-600" : 
                 ['D', 'E'].includes(property.epcEE) ? "bg-yellow-500" : "bg-red-500"
               )}>
                 EPC {property.epcEE}
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
