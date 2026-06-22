import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, Map as MapIcon, LayoutGrid, ChevronDown, Search, X, MapPin, Plus, Loader2, Home as LucideHome } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap, ZoomControl } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';

// Fix Leaflet default icon paths
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

import PropertyCard from '../components/PropertyCard';
import AdSenseSlot from '../components/AdSenseSlot';
import { Property, mockProperties } from '../constants/mockData';
import { cn } from '../lib/utils';
import LocationSearch from '../components/LocationSearch';
import PriceFilter from '../components/PriceFilter';
import { db } from '../lib/firebase';
import { collection, query as fireQuery, getDocs, where as fireWhere } from 'firebase/firestore';

// Haversine formula to calculate distance in miles
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'london': { lat: 51.5074, lng: -0.1278 },
  'manchester': { lat: 53.4808, lng: -2.2426 },
  'birmingham': { lat: 52.4862, lng: -1.8904 },
  'bristol': { lat: 51.4545, lng: -2.5879 },
  'leeds': { lat: 53.8008, lng: -1.5491 },
  'glasgow': { lat: 55.8642, lng: -4.2518 },
  'edinburgh': { lat: 55.9533, lng: -3.1883 },
  'liverpool': { lat: 53.4084, lng: -2.9916 },
  'sheffield': { lat: 53.3811, lng: -1.4701 },
  'cardiff': { lat: 51.4816, lng: -3.1791 }
};

// Custom component to handle dynamic map updates and bounds fitting
function MapController({ 
  center, 
  radiusInMiles,
  trigger
}: { 
  center: { lat: number, lng: number }, 
  radiusInMiles: number,
  trigger?: any
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!center || !map) return;
    
    // Small delay to ensure the map container has its actual dimensions
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
        const radiusInMeters = radiusInMiles * 1609.34;
        
        // CRITICAL: We must add the circle to the map before calling getBounds()
        // so Leaflet can access the map's CRS (Coordinate Reference System).
        const tempCircle = L.circle([center.lat, center.lng], { radius: radiusInMeters }).addTo(map);
        const bounds = tempCircle.getBounds();
        tempCircle.remove();
        
        map.fitBounds(bounds, { padding: [20, 20], animate: true });
      } catch (err) {
        console.error("Map sizing error:", err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [center, radiusInMiles, map, trigger]);

  return null;
}

const customIcon = (isActive: boolean) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: ${isActive ? '#D4AF37' : '#1b3022'};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    transform: ${isActive ? 'scale(1.5)' : 'scale(1)'};
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'Buy' ? 'Buy' : 'Rent';
  const initialQuery = searchParams.get('q') || '';

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('split');
  const [query, setQuery] = useState(initialQuery);
  const [activeSearch, setActiveSearch] = useState(initialQuery);
  const [showError, setShowError] = useState(false);
  
  // Find initial map center based on query
  const getInitialCenter = () => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    if (latParam && lngParam && !isNaN(parseFloat(latParam)) && !isNaN(parseFloat(lngParam))) {
      return { lat: parseFloat(latParam), lng: parseFloat(lngParam) };
    }
    if (initialQuery) {
      const cityData = CITY_COORDS[initialQuery.toLowerCase()];
      if (cityData) return cityData;
    }
    return { lat: 51.505, lng: -0.09 };
  };

  const [mapCenter, setMapCenter] = useState(getInitialCenter());
  const [mapZoom, setMapZoom] = useState(initialQuery && CITY_COORDS[initialQuery.toLowerCase()] ? 12 : 13);
  const [minPrice, setMinPrice] = useState(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max') || '');
  const [radius, setRadius] = useState<number>(1); // Default 1 mile
  const [searchMode, setSearchMode] = useState<'Buy' | 'Rent'>(initialMode);
  const [minBeds, setMinBeds] = useState<string | null>(null);
  const [maxBeds, setMaxBeds] = useState<string | null>(null);
  const [minBaths, setMinBaths] = useState<string | null>(null);
  const [maxBaths, setMaxBaths] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);

  const RENTING_PRICE_OPTIONS = [
    250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000
  ];

  const BUYING_PRICE_OPTIONS = [
    50000, 100000, 150000, 200000, 250000, 300000, 400000, 500000, 600000, 700000, 800000, 900000,
    1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000, 5000000, 7500000, 10000000
  ];

  const RADIUS_OPTIONS = [0.5, 1, 2, 5, 10, 12, 15, 20, 25, 50, 100];

  const priceOptions = searchMode === 'Buy' ? BUYING_PRICE_OPTIONS : RENTING_PRICE_OPTIONS;

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showFiltersPlus, setShowFiltersPlus] = useState(false);

  const resetFilters = () => {
    setQuery('');
    setMinPrice('');
    setMaxPrice('');
    setRadius(1);
    setSelectedType(null);
    setMinBeds(null);
    setMaxBeds(null);
    setMinBaths(null);
    setMaxBaths(null);
    setPreferences({
      shared: false,
      student: false,
      retirement: false
    });
  };
  const [selectedBaths, setSelectedBaths] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    shared: false,
    student: false,
    retirement: false
  });
  const [scrollTop, setScrollTop] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(80);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function resolveLocation() {
      const latParam = searchParams.get('lat');
      const lngParam = searchParams.get('lng');
      if (initialQuery && (!latParam || !lngParam) && !CITY_COORDS[initialQuery.toLowerCase()]) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(initialQuery)}&countrycodes=gb&limit=1`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              if (!isNaN(lat) && !isNaN(lon)) {
                setMapCenter({ lat, lng: lon });
                setMapZoom(14);
              }
            }
          }
        } catch (error) {
          console.warn("Failed to resolve fallback coordinates", error);
        }
      }
    }
    resolveLocation();
  }, [initialQuery, searchParams]);

  useEffect(() => {
    async function fetchProperties() {
      setIsLoading(true);
      try {
        const q = fireQuery(collection(db, 'properties'), fireWhere('status', 'in', ['Live', 'Let Agreed']));
        const querySnapshot = await getDocs(q);
        const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        
        // Only use properties from the database
        setProperties(props);
      } catch (err: any) {
        if (err.code === 'permission-denied') {
          console.error("Access Restricted: Your search query was blocked by security rules. Ensure you are only querying 'Live' properties or your own listings.");
        } else {
          console.error("Error fetching properties:", err);
        }
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Filter strictly by Buy/Rent (listing_type) mode
    filtered = filtered.filter(p => {
      const type = (p.listing_type || 'Let').toLowerCase();
      if (searchMode === 'Buy') {
        return type === 'buy' || type === 'sale';
      } else {
        return type === 'let' || type === 'rent' || type === 'renting';
      }
    });
    
    // Filter strictly by the selected radius (e.g., 5 miles) from the map center
    const searchString = (activeSearch || query || '').toLowerCase().trim();
    filtered = filtered.filter(p => {
      if (!searchString) {
        return true; // If no location typed, automatic visibility for all properties!
      }
      const hasCoords = typeof p.lat === 'number' && typeof p.lng === 'number';
      if (!hasCoords) {
        // Fallback to text match if no valid spatial coordinates are mapped yet
        return p.location?.toLowerCase().includes(searchString) || 
               p.locationSearch?.toLowerCase().includes(searchString) ||
               p.title?.toLowerCase().includes(searchString);
      }
      
      const distance = getDistance(mapCenter.lat, mapCenter.lng, p.lat, p.lng);
      return distance <= radius;
    });

    if (minPrice) {
      filtered = filtered.filter(p => {
        const val = p.price ? parseInt(String(p.price).replace(/[^\d]/g, '')) : 0;
        return !isNaN(val) && val >= parseInt(minPrice);
      });
    }
    if (maxPrice) {
      filtered = filtered.filter(p => {
        const val = p.price ? parseInt(String(p.price).replace(/[^\d]/g, '')) : 0;
        return !isNaN(val) && val <= parseInt(maxPrice);
      });
    }

    if (minBeds) {
      const min = minBeds === 'Studio' ? 0 : parseInt(minBeds);
      filtered = filtered.filter(p => p.bedrooms >= min);
    }
    if (maxBeds) {
      const max = maxBeds === '12+' ? 99 : parseInt(maxBeds);
      filtered = filtered.filter(p => p.bedrooms <= max);
    }

    if (minBaths) {
      const min = minBaths === 'En-suite' ? 0 : parseInt(minBaths);
      filtered = filtered.filter(p => (p.bathrooms || 0) >= min);
    }
    if (maxBaths) {
      const max = maxBaths === '8+' ? 99 : parseInt(maxBaths);
      filtered = filtered.filter(p => (p.bathrooms || 0) <= max);
    }

    if (selectedType) {
      const type = selectedType.toLowerCase();
      filtered = filtered.filter(p => 
        p.type.toLowerCase() === type || 
        (type === 'houses' && p.type.toLowerCase() === 'house') || 
        (type === 'flats' && p.type.toLowerCase() === 'apartment') ||
        (type === 'detached' && p.type.toLowerCase().includes('detached')) ||
        (type === 'terrace' && p.type.toLowerCase().includes('terrace'))
      );
    }

    if (preferences.shared) filtered = filtered.filter(p => p.isShared);
    if (preferences.student) filtered = filtered.filter(p => p.isStudent);
    if (preferences.retirement) filtered = filtered.filter(p => p.isRetirement);

    return filtered;
  }, [properties, searchMode, mapCenter, radius, minPrice, maxPrice, minBeds, maxBeds, selectedType, minBaths, maxBaths, preferences, activeSearch, query]);

  useEffect(() => {
    if (activeSearch && filteredProperties.length === 0) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [filteredProperties, activeSearch]);

  const clearSearch = () => {
    setActiveSearch('');
    setMinBeds(null);
    setMaxBeds(null);
    setMinBaths(null);
    setMaxBaths(null);
    setMinPrice('');
    setMaxPrice('');
    setShowError(false);
  };

  const handleLocationSelect = (data: { description: string, location: { lat: number; lng: number } | null }) => {
    setActiveSearch(data.description);
    if (data.location) {
      setMapCenter(data.location);
      setMapZoom(14);
    }
  };

  // Synchronize map center and radius circle with active search or query changes
  useEffect(() => {
    const searchString = (activeSearch || query || '').trim().toLowerCase();
    if (!searchString) return;

    // Check if it's already a well-known city coordinate
    const cityData = CITY_COORDS[searchString];
    if (cityData) {
      setMapCenter(cityData);
      setMapZoom(12);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchString)}&countrycodes=gb&limit=1`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            if (!isNaN(lat) && !isNaN(lon)) {
              setMapCenter(prev => {
                // Prevent infinite loop if coordinate change is negligible
                const diff = Math.abs(prev.lat - lat) + Math.abs(prev.lng - lon);
                if (diff > 0.005) {
                  return { lat, lng: lon };
                }
                return prev;
              });
            }
          }
        }
      } catch (error) {
        console.warn("Fuzzy geocoding failed for search text:", error);
      }
    }, 600); // 600ms debounce to respect Nominatim usage rules and prevent lag

    return () => clearTimeout(timer);
  }, [activeSearch, query]);

  useEffect(() => {
    const handleScroll = () => {
      const st = window.scrollY;
      setScrollTop(st);
      // Threshold matches Navbar.tsx
      if (st > 400) {
        setNavbarHeight(64);
      } else {
        setNavbarHeight(80);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMinimized = false; // Disable dynamic minimization for a static look

  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const PROPERTY_TYPES = ['House', 'Flat', 'Detached', 'Terrace'];
  const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12+'];
  const BATHROOM_OPTIONS = ['En-suite', '1', '2', '3', '4', '5', '6', '8+'];

  const [isBedsOpen, setIsBedsOpen] = useState(false);
  const [isBathsOpen, setIsBathsOpen] = useState(false);

  return (
    <div className="bg-secondary min-h-screen">
      {/* Search Header Bar - Fixed and optimized for mobile/tablet stacking */}
      <header 
        className="bg-primary fixed z-[1100] shadow-2xl border-b border-white/10 transition-all duration-700 ease-in-out w-full left-0"
        style={{ top: `${navbarHeight}px` }}
      >
        <div className="max-w-[1800px] mx-auto px-3 md:px-8 py-2 md:py-0 md:h-14 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          {/* Main Search Row */}
          <div className="flex items-center gap-2 flex-grow">
            {/* Buy/Rent Mode Slider */}
            <div className="flex bg-white/5 p-0.5 md:p-1 rounded-lg md:rounded-xl border border-white/10 shrink-0 relative">
              <motion.div 
                layoutId="search-mode-bg"
                className="absolute bg-accent rounded-md md:rounded-lg shadow-lg"
                initial={false}
                animate={{ 
                  x: searchMode === 'Buy' ? 0 : '100%',
                  left: isMobile ? 2 : 4,
                  width: isMobile ? 'calc(50% - 2px)' : 'calc(50% - 4px)',
                  height: isMobile ? 'calc(100% - 4px)' : 'calc(100% - 8px)',
                  top: isMobile ? 2 : 4
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              {['Buy', 'Rent'].map((mode) => (
                <button 
                  key={mode}
                  onClick={() => setSearchMode(mode as 'Buy' | 'Rent')}
                  className={cn(
                    "relative z-10 px-3 md:px-6 py-1.5 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all duration-300",
                    searchMode === mode ? "text-primary" : "text-white/40 hover:text-white"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-white/10 shrink-0 mx-0.5 md:mx-1 hidden md:block" />

            <div className="flex-grow min-w-0">
              <LocationSearch 
                value={query}
                onChange={setQuery}
                onSelect={handleLocationSelect}
                placeholder="Search..."
                minimized={true}
                className="w-full"
              />
            </div>
          </div>

          {/* Filters Row on mobile, same row on desktop */}
          <div className="flex items-center gap-1.5 md:gap-2 justify-between w-full md:w-auto md:justify-end shrink-0">
            <div className="relative group shrink-0 w-[22%] md:w-28">
              <select 
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-black border border-white/10 outline-none focus:border-accent text-white text-[10px] md:text-[11px] font-bold appearance-none cursor-pointer rounded-lg md:rounded-xl transition-all"
              >
                {RADIUS_OPTIONS.map(r => (
                  <option key={r} value={r}>
                    {r < 1 ? `Exact` : `+${r}m`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 md:w-3 h-3 text-white/40 pointer-events-none" />
            </div>

            <PriceFilter 
              label="Min"
              value={minPrice}
              onChange={setMinPrice}
              options={priceOptions}
              minimized={true}
              className="w-[24%] md:w-32 shrink-0"
            />
            <PriceFilter 
              label="Max"
              value={maxPrice}
              onChange={setMaxPrice}
              options={priceOptions}
              minimized={true}
              className="w-[24%] md:w-32 shrink-0"
            />

            <div className="shrink-0 w-[20%] md:w-auto" ref={filtersRef}>
              <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={cn(
                  "w-full bg-black hover:bg-black/80 text-white rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-1.5 md:gap-2 px-1 md:px-4 py-2 md:py-2.5",
                  isFiltersOpen && "border-accent bg-accent text-primary shadow-glow"
                )}
              >
                <SlidersHorizontal className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <AnimatePresence>
                {isFiltersOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-[calc(100%+8px)] right-0 w-[calc(100vw-24px)] md:w-80 bg-primary border border-white/10 rounded-[2.5rem] shadow-2xl z-[1200] p-8 overflow-hidden"
                  >
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                    <div>
                      <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-4">Property Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {PROPERTY_TYPES.map(item => (
                          <button 
                            key={item} 
                            onClick={() => setSelectedType(selectedType === item ? null : item)}
                            className={cn(
                              "px-3 py-3 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                              selectedType === item 
                                ? "bg-accent text-primary border-accent" 
                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-6">
                      <button 
                        onClick={() => setIsBedsOpen(!isBedsOpen)}
                        className="w-full flex items-center justify-between text-[10px] font-black text-accent uppercase tracking-widest mb-4"
                      >
                        Bedrooms
                        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isBedsOpen ? "rotate-180" : "")} />
                      </button>
                      
                      <AnimatePresence>
                        {isBedsOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-5 overflow-hidden"
                          >
                            <div>
                              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-3">Minimum</p>
                              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {BEDROOM_OPTIONS.map(item => (
                                  <button 
                                    key={`min-bed-${item}`} 
                                    onClick={() => setMinBeds(minBeds === item ? null : item)}
                                    className={cn(
                                      "flex-shrink-0 w-12 h-12 rounded-xl border text-[11px] font-black transition-all flex items-center justify-center",
                                      minBeds === item 
                                        ? "bg-accent text-primary border-accent" 
                                        : "bg-white/5 border-white/10 text-white/40"
                                    )}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-3">Maximum</p>
                              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {BEDROOM_OPTIONS.map(item => (
                                  <button 
                                    key={`max-bed-${item}`} 
                                    onClick={() => setMaxBeds(maxBeds === item ? null : item)}
                                    className={cn(
                                      "flex-shrink-0 w-12 h-12 rounded-xl border text-[11px] font-black transition-all flex items-center justify-center",
                                      maxBeds === item 
                                        ? "bg-accent text-primary border-accent" 
                                        : "bg-white/5 border-white/10 text-white/40"
                                    )}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="border-t border-white/5 pt-6">
                      <button 
                        onClick={() => setIsBathsOpen(!isBathsOpen)}
                        className="w-full flex items-center justify-between text-[10px] font-black text-accent uppercase tracking-widest mb-4"
                      >
                        Bathrooms
                        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isBathsOpen ? "rotate-180" : "")} />
                      </button>
                      
                      <AnimatePresence>
                        {isBathsOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-5 overflow-hidden"
                          >
                            <div>
                              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-3">Minimum</p>
                              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {BATHROOM_OPTIONS.map(item => (
                                  <button 
                                    key={`min-bath-${item}`} 
                                    onClick={() => setMinBaths(minBaths === item ? null : item)}
                                    className={cn(
                                      "flex-shrink-0 w-12 h-12 rounded-xl border text-[11px] font-black transition-all flex items-center justify-center",
                                      minBaths === item 
                                        ? "bg-accent text-primary border-accent" 
                                        : "bg-white/5 border-white/10 text-white/40"
                                    )}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-3">Maximum</p>
                              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {BATHROOM_OPTIONS.map(item => (
                                  <button 
                                    key={`max-bath-${item}`} 
                                    onClick={() => setMaxBaths(maxBaths === item ? null : item)}
                                    className={cn(
                                      "flex-shrink-0 w-12 h-12 rounded-xl border text-[11px] font-black transition-all flex items-center justify-center",
                                      maxBaths === item 
                                        ? "bg-accent text-primary border-accent" 
                                        : "bg-white/5 border-white/10 text-white/40"
                                    )}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                      {['shared', 'student', 'retirement'].map((key) => (
                        <div key={key} className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{key.replace(/^\w/, c => c.toUpperCase())} Homes</label>
                          <button 
                            onClick={() => setPreferences(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                            className={cn(
                              "w-11 h-6 rounded-full transition-all relative p-1",
                              preferences[key as keyof typeof preferences] ? "bg-accent" : "bg-white/10"
                            )}
                          >
                            <motion.div 
                              animate={{ x: preferences[key as keyof typeof preferences] ? 20 : 0 }}
                              className="w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => setIsFiltersOpen(false)}
                      className="w-full py-5 bg-accent text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/10"
                    >
                      Update View
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>

      {/* Main Content Spacer for fixed header */}
      <div style={{ height: `${navbarHeight + (isMobile ? 104 : 56)}px` }} />


      {/* Error Bar */}
      <AnimatePresence>
        {showError && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 overflow-hidden"
          >
            <div className="max-w-[1800px] mx-auto px-8 py-3 flex items-center justify-between">
              <span className="text-red-500 text-xs font-bold uppercase tracking-widest">No properties found within {radius} miles of "{activeSearch || 'current area'}"</span>
              <button 
                onClick={clearSearch}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "max-w-[1920px] mx-auto flex flex-col lg:flex-row min-h-screen",
      )}>
        {/* Listings Section */}
        <div className={cn(
          "bg-[#F9F7F2] p-6 lg:px-12 lg:py-10 border-r border-border",
          viewMode === 'split' ? "w-full lg:w-[600px] xl:w-[650px]" : "w-full",
          showMapMobile && "hidden lg:block"
        )}>
          <div className="flex justify-between items-center mb-10 border-b border-border pb-6">
            <div>
              <h2 className="font-serif text-3xl leading-tight text-primary">Properties in <span className="italic">{activeSearch || 'UK'}</span></h2>
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold mt-2">Verified Lettings and Sales</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Results</p>
              <p className="text-xl font-bold text-primary">{filteredProperties.length}</p>
            </div>
          </div>

          <div className={cn(
            "flex flex-col gap-6",
            viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {isLoading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
                <h3 className="text-2xl font-serif italic text-primary/40">Synchronizing inventory...</h3>
                <p className="text-[10px] text-primary/20 font-black uppercase tracking-[0.4em] mt-4">Connecting to House of Eden global database</p>
              </div>
            ) : filteredProperties.length > 0 ? (
              filteredProperties.map((property, idx) => (
                <Fragment key={property.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    id={`property-${property.id}`}
                    className={cn(
                      "transition-all duration-300",
                      hoveredId === property.id && "scale-[1.02] z-10"
                    )}
                  >
                    <PropertyCard 
                      property={property} 
                      onHover={setHoveredId}
                    />
                  </motion.div>

                  {/* Google AdSense slot inserted dynamically after every second listing in search feed */}
                  {(idx + 1) % 2 === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="col-span-1"
                    >
                      <AdSenseSlot 
                        slot={`1049248232-${idx}`} 
                        format="rectangle"
                        className="h-[380px] md:h-[400px]"
                      />
                    </motion.div>
                  )}
                </Fragment>
              ))
            ) : (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 border border-border/50">
                  <LucideHome className="w-10 h-10 text-primary/10" />
                </div>
                <h3 className="text-3xl font-serif italic text-primary/80 mb-3">No matching listings</h3>
                <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em] max-w-sm leading-relaxed">
                  Refine your search parameters or expand your radius to discover more opportunities with HOE Property Management
                </p>
                <button 
                  onClick={resetFilters}
                  className="mt-10 text-accent text-[10px] font-black uppercase tracking-widest border-b-2 border-accent pb-1 hover:text-accent-hover transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

      {/* interactive map (right) section */}
        <AnimatePresence mode="wait">
          {viewMode === 'split' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex-1 sticky overflow-hidden lg:p-4 bg-secondary transition-all duration-700",
                !showMapMobile && "hidden lg:block"
              )}
              style={{ 
                top: `${navbarHeight + (isMobile ? 104 : 56)}px`, 
                height: `calc(100vh - ${navbarHeight + (isMobile ? 104 : 56)}px)` 
              }}
            >
              <div className="w-full h-full rounded-3xl overflow-hidden border border-border bg-gray-100 shadow-inner">
                <MapContainer
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={mapZoom}
                  className="w-full h-full"
                  zoomControl={false}
                  scrollWheelZoom={false}
                >
                <ZoomControl position="topright" />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={mapCenter} radiusInMiles={radius} trigger={`${showMapMobile}-${viewMode}-${navbarHeight}`} />
                
                 {/* Search Radius Circle Overlay - RESTORED and ENHANCED */}
                 <Circle 
                   key={`circle-${mapCenter.lat}-${mapCenter.lng}-${radius}`}
                   center={[mapCenter.lat, mapCenter.lng]}
                   radius={radius * 1609.34} // convert miles to meters
                   pathOptions={{
                     color: '#D4AF37', // Gold brand color
                     fillColor: '#D4AF37',
                     fillOpacity: 0.25, // Increased visibility
                     weight: 3,
                     dashArray: '5, 10' // Slight dash for premium technical look
                   }}
                 />

                {filteredProperties.map((property) => (
                  <Marker 
                    key={property.id} 
                    position={[property.lat, property.lng]}
                    icon={customIcon(hoveredId === property.id)}
                    eventHandlers={{
                      click: () => {
                        const el = document.getElementById(`property-${property.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setHoveredId(property.id);
                      },
                      mouseover: () => setHoveredId(property.id),
                      mouseout: () => setHoveredId(null)
                    }}
                  />
                ))}
              </MapContainer>
              </div>

              <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[1000] p-4">
                 <div className="p-2 bg-white rounded-lg shadow-lg text-[10px] font-bold text-primary max-w-[200px]">
                   Map data &copy; OpenStreetMap contributors
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Mobile Toggle Button - Prominent and separate experience */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2500] lg:hidden">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setShowMapMobile(!showMapMobile);
          }}
          className="bg-accent text-primary px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_15px_30px_rgba(212,175,55,0.4)] flex items-center gap-3 border border-white/20 active:scale-95 transition-all"
        >
          {showMapMobile ? (
            <>
              <LayoutGrid className="w-5 h-5" />
              <span>Browse Listings</span>
            </>
          ) : (
            <>
              <MapIcon className="w-5 h-5" />
              <span>Interactive Map</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
