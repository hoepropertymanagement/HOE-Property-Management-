import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Fuse from 'fuse.js';
import { cn } from '../lib/utils';
import { ukLocationHierarchy, UKLocation } from '../constants/ukLocations';

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (data: { description: string; location: { lat: number; lng: number } | null }) => void;
  placeholder?: string;
  className?: string;
  minimized?: boolean;
}

interface SearchResult {
  place_id: string | number;
  primary: string;
  secondary: string;
  full: string;
  lat: string;
  lon: string;
  type?: string;
  distance?: number;
}

export default function LocationSearch({ value, onChange, onSelect, placeholder, className, minimized }: LocationSearchProps) {
  const [predictions, setPredictions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Fuse with more permissive threshold for 'near-match' logic
  const fuse = useMemo(() => new Fuse(ukLocationHierarchy, {
    keys: ['name', 'parent'],
    threshold: 0.45, // More permissive to catch misspellings and "near" matches
    includeMatches: true,
    minMatchCharLength: 2,
    location: 0,
    distance: 100,
    ignoreLocation: true
  }), []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatUKLocation = (loc: UKLocation) => {
    // Flattening logic: strip redundant tiers
    const primary = loc.name;
    let secondary = loc.parent || "United Kingdom";
    
    // Macro Geographic Entity Removal
    const macroIdentifiers = ["England", "United Kingdom", "UK", "Great Britain", "Wales", "Scotland", "Northern Ireland", "Greater London"];
    if (macroIdentifiers.includes(secondary) && loc.type !== 'county') {
      // If parent is a country/macro-region, try to keep it but if it's redundant we could just use UK
      // However, user said specifically to strip "Greater London", "England" etc.
      secondary = "United Kingdom";
    }

    return { primary, secondary };
  };

  const normalizeNominatim = (p: any): SearchResult => {
    const fullParts = p.display_name.split(',').map((part: string) => part.trim());
    
    // Geographic Hierarchy Flattening Logic
    const macroIdentifiersRegex = /\b(Greater London|Greater London Authority|England|United Kingdom|UK|Great Britain|Wales|Scotland|Northern Ireland|County|Borough of|London Borough of)\b/gi;
    
    // Extraction: keep only core localized identifiers
    let primary = fullParts[0].replace(macroIdentifiersRegex, '').trim();
    if (!primary && fullParts.length > 1) {
      primary = fullParts[1].replace(macroIdentifiersRegex, '').trim();
    }

    let secondary = "United Kingdom";
    if (fullParts.length >= 3) {
      const candidate = fullParts[2].replace(macroIdentifiersRegex, '').trim();
      if (candidate) secondary = candidate;
    } else if (fullParts.length >= 2) {
      const candidate = fullParts[1].replace(macroIdentifiersRegex, '').trim();
      if (candidate) secondary = candidate;
    }

    return {
      place_id: p.place_id,
      primary: primary || fullParts[0],
      secondary: secondary,
      full: p.display_name,
      lat: p.lat,
      lon: p.lon,
      type: p.type
    };
  };

  const handlePlaceSelect = (prediction: SearchResult) => {
    // 1. Selection pasted into bar must follow simplified name rule (Replace, don't append)
    const inputValue = prediction.primary;
    onChange(inputValue); 
    
    // 2. Immediate Termination Logic: nuke suggestions immediately
    setPredictions([]);
    setIsOpen(false);
    
    // 3. Search Submission Lock
    setIsLocked(true);
    setHasSelected(true);
    
    onSelect?.({
      description: `${prediction.primary}, ${prediction.secondary}`,
      location: { lat: parseFloat(prediction.lat), lng: parseFloat(prediction.lon) }
    });
  };

  useEffect(() => {
    const fetchPredictions = async () => {
      // Logic constraint: If locked or selected via click, don't re-trigger unless input changes significantly
      if (!value || value.length < 1 || isLocked) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);

      try {
        // 1. Fuzzy match on local hierarchy (Higher priority for 'near-match' logic)
        const localMatches = fuse.search(value).slice(0, 8).map(result => {
          const { primary, secondary } = formatUKLocation(result.item);
          return {
            place_id: `local-${result.item.name}`,
            primary,
            secondary,
            full: `${primary}, ${secondary}`,
            lat: result.item.lat?.toString() || "51.5074",
            lon: result.item.lng?.toString() || "-0.1278",
            type: result.item.type
          };
        });

        // 2. Supplement with Nominatim API for full coverage (Graceful fallback)
        let apiMatches: SearchResult[] = [];
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=gb&addressdetails=1&limit=20`
          );
          if (response.ok) {
            const data = await response.json();
            apiMatches = data.map(normalizeNominatim);
          }
        } catch (apiError) {
          console.warn('External search omitted, using local intelligence');
        }

        // 3. De-duplication and Sorting
        const combined = [...localMatches, ...apiMatches];
        const seen = new Set();
        const unique = combined.filter(p => {
          const key = `${p.primary}-${p.secondary}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setPredictions(unique.slice(0, 15));
        
        // Only open if we actually have matches and we're not locked
        if (!isLocked && unique.length > 0) {
          setIsOpen(true);
        }
      } catch (error) {
        // Silent error handling for smooth UI
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchPredictions, 150);
    return () => clearTimeout(timeout);
  }, [value, isLocked, fuse]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      
      const target = event.target as HTMLElement;
      const buttonText = target.closest('button')?.innerText?.toLowerCase() || '';
      // Search Lockdown: suggestions shouldn’t appear again after find properties is clicked 
      if (buttonText.includes('find properties') || buttonText.includes('update')) {
        setIsOpen(false);
        setIsLocked(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Spatial Aggregation: Grouping
  const primaryMatch = predictions.length > 0 ? predictions[0] : null;
  const nearbyPlaces = predictions.length > 1 ? predictions.slice(1).map(p => {
    if (primaryMatch && p.lat && p.lon && primaryMatch.lat && primaryMatch.lon) {
      const dist = calculateDistance(
        parseFloat(primaryMatch.lat), parseFloat(primaryMatch.lon),
        parseFloat(p.lat), parseFloat(p.lon)
      );
      return { ...p, distance: dist };
    }
    return p;
  }) : [];

  return (
    <div className={cn("relative z-[2000]", className)} ref={dropdownRef}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isLoading ? (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full"
          />
        ) : (
          <Search className="w-4 h-4 text-accent" />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsLocked(false);
          setHasSelected(false);
          if (e.target.value.length >= 1) setIsOpen(true);
        }}
        onFocus={() => {
          setIsLocked(false);
          if (value.length >= 1) setIsOpen(true);
        }}
        onClick={() => {
          setIsLocked(false);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && predictions.length > 0) {
            handlePlaceSelect(predictions[0]);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full pl-11 pr-11 bg-white border border-border outline-none focus:border-accent text-black placeholder:text-black/40 transition-all font-bold text-sm shadow-sm",
          minimized ? "py-2.5 rounded-xl" : "py-3 rounded-xl",
          isOpen && predictions.length > 0 && "rounded-b-none border-b-transparent shadow-none"
        )}
      />

      {value && (
        <button 
          onClick={() => {
            onChange('');
            setIsLocked(false);
            setHasSelected(false);
            setPredictions([]);
          }}
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/5 hover:bg-primary/10 flex items-center justify-center transition-colors group"
          )}
        >
          <div className="w-2.5 h-2.5 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-primary/40 group-hover:bg-primary rotate-45 rounded-full" />
            <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-primary/40 group-hover:bg-primary -rotate-45 rounded-full" />
          </div>
        </button>
      )}

      <AnimatePresence>
        {isOpen && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={cn(
              "absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-border rounded-2xl z-[3000] max-h-[40vh] md:max-h-[500px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col"
            )}
          >
            <div className="overflow-y-auto custom-scrollbar p-3 space-y-4">
              {primaryMatch && (
                <div className="space-y-2">
                  <div className="px-4 py-1.5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em]">Select Location</span>
                  </div>
                  <button
                    onClick={() => handlePlaceSelect(primaryMatch)}
                    className="w-full px-5 py-4 bg-secondary/30 hover:bg-accent rounded-xl cursor-pointer text-primary flex items-center gap-4 transition-all duration-300 text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent group-hover:bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-accent/20 transition-colors">
                      <MapPin className="w-5 h-5 text-primary group-hover:text-accent" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-black text-black text-base truncate tracking-tight group-hover:text-primary transition-colors">
                        {primaryMatch.primary}
                      </span>
                      <span className="text-[10px] font-black text-black/40 uppercase tracking-wider truncate group-hover:text-primary/60 transition-colors">
                        {primaryMatch.secondary}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {nearbyPlaces.length > 0 && (
                <div className="space-y-1">
                  <div className="px-4 py-1.5">
                    <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em]">Suggestions</span>
                  </div>
                  <div className="space-y-0.5">
                    {nearbyPlaces.slice(0, 5).map((p) => {
                      const distanceLabel = p.distance !== undefined ? `${p.distance.toFixed(1)} miles` : '';
                      
                      return (
                        <button
                          key={p.place_id}
                          onClick={() => handlePlaceSelect(p)}
                          className="w-full px-4 py-3 hover:bg-secondary rounded-xl cursor-pointer text-sm font-bold text-primary flex items-center justify-between transition-colors text-left group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                              <MapPin className="w-3.5 h-3.5 text-primary/30 group-hover:text-primary" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-bold text-black truncate group-hover:text-accent transition-colors">
                                {p.primary}
                              </span>
                              <span className="text-[9px] font-black text-black/30 uppercase tracking-widest truncate">
                                {p.secondary} {distanceLabel && `• ${distanceLabel}`}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-secondary/30 p-3 border-t border-border flex items-center justify-center">
              <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.3em]">UK Real Estate Precision Search</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

