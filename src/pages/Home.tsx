import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, ShieldCheck, Clock, Award, Home as HomeIcon, MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import React from 'react';
import { cn } from '../lib/utils';
import PriceFilter from '../components/PriceFilter';
import LocationSearch from '../components/LocationSearch';
import PropertyCard from '../components/PropertyCard';
import EnquiryForm from '../components/EnquiryForm';
import { Property, mockProperties } from '../constants/mockData';
import { db } from '../lib/firebase';
import { collection, query as fireQuery, limit, getDocs, where } from 'firebase/firestore';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [searchMode, setSearchMode] = useState<'Buy' | 'Rent'>('Rent');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [queryTerm, setQueryTerm] = useState('');

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const q = fireQuery(
          collection(db, 'properties'), 
          where('status', '==', 'Live'),
          limit(3)
        );
        const querySnapshot = await getDocs(q);
        const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        
        // Fetch from Supabase as well!
        let sbFeatured: Property[] = [];
        try {
          const { data: sbData, error: sbError } = await supabase
            .from('properties')
            .select('*')
            .eq('status', 'Live')
            .limit(3);
          
          if (!sbError && sbData) {
            sbFeatured = sbData.map((item: any) => ({
              id: item.id,
              title: item.title || item.name || 'Untitled Property',
              description: item.description || '',
              image: item.image || item.image_url || '',
              images: item.images || [],
              price: typeof item.price === 'number' ? `£${item.price.toLocaleString()}` : (item.price || ''),
              beds: item.beds || item.bedrooms || 0,
              bedrooms: item.beds || item.bedrooms || 0,
              baths: item.baths || item.bathrooms || 0,
              bathrooms: item.baths || item.bathrooms || 0,
              status: item.status || 'Live',
              landlordId: item.landlord_id || '',
              views: item.views || 0,
              contactNumber: item.contact_number || '',
              councilTax: item.council_tax || 'Band A',
              energyEfficiency: item.energy_efficiency || 'E',
              environmentalImpact: item.environmental_impact || 'E',
              location: item.location || '',
              lat: typeof item.lat === 'number' ? item.lat : undefined,
              lng: typeof item.lng === 'number' ? item.lng : undefined,
            } as unknown as Property));
          }
        } catch (sbErr) {
          console.warn("Silent Supabase featured properties fetch error:", sbErr);
        }

        // Merge with system memory mock properties
        const merged = [...props];
        sbFeatured.forEach(sbProp => {
          if (!merged.some(p => p.id === sbProp.id)) {
            merged.push(sbProp);
          }
        });

        mockProperties.slice(0, 3).forEach(mockItem => {
          if (!merged.some(p => p.id === mockItem.id)) {
            merged.push(mockItem);
          }
        });
        setFeaturedProperties(merged.slice(0, 3));
      } catch (err: any) {
        if (err.code === 'permission-denied') {
          console.error("Permission Denied: Unable to access featured properties. Please ensure the Firestore security rules allow public reading of live properties.");
        } else {
          console.error("Error fetching featured properties:", err);
        }
        // Fallback purely to sliced system memory mock properties
        setFeaturedProperties(mockProperties.slice(0, 3));
      } finally {
        setLoadingFeatured(false);
      }
    }
    fetchFeatured();
  }, []);

  // Enquiry Form State
  const [formData, setFormData] = useState({
    type: '',
    address1: '',
    city: '',
    county: '',
    postcode: '',
    name: '',
    email: '',
    phone: '',
    enquiryText: '',
    consent: false
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];
    if (!formData.type) newErrors.push('type');
    if (!formData.address1) newErrors.push('address1');
    if (!formData.city) newErrors.push('city');
    if (!formData.postcode) newErrors.push('postcode');
    if (!formData.name) newErrors.push('name');
    if (!formData.email) newErrors.push('email');
    if (!formData.phone) newErrors.push('phone');
    if (!formData.enquiryText) newErrors.push('enquiryText');
    if (!formData.consent) newErrors.push('consent');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Automated Silent Enquiry Routing Implementation
    try {
      // 1. Direct Supabase Insert
      const { error: sbError } = await supabase.from('enquiries').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: `New Property Enquiry: ${formData.type} - ${formData.name}`,
        message: formData.enquiryText,
        property_address: `${formData.address1}${formData.county ? ', ' + formData.county : ''}, ${formData.city}, ${formData.postcode}`,
        request_type: formData.type,
        source: 'Home Page Valuation Form'
      });

      if (sbError) throw sbError;

      // 2. Fallback to Invoke edge function directly from client
      try {
        await fetch("https://vlmqmmkenhzkcyqclswy.supabase.co/functions/v1/send-system-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            formType: "consultation",
            name: formData.name,
            userEmail: formData.email,
            phone: formData.phone,
            message: formData.enquiryText,
            propertyDetails: `Request Type: ${formData.type}\nProperty Address: ${formData.address1}, ${formData.city}, ${formData.postcode}\nMarketing Consent: ${formData.consent ? "Yes" : "No"}`,
            subject: `[HOE Enquiry] New Property Enquiry: ${formData.type} - ${formData.name}`
          })
        });
      } catch (e) {
        console.warn('Silent email edge function failing - captured in DB safely.', e);
      }

      // Clear the input fields natively using form.reset() style state update
      setFormData({
        type: '',
        address1: '',
        city: '',
        county: '',
        postcode: '',
        name: '',
        email: '',
        phone: '',
        enquiryText: '',
        consent: false
      });
      setErrors([]);
      setIsSubmitted(true);
      // Reset success state after 6 seconds
      setTimeout(() => setIsSubmitted(false), 6000);
    } catch (err) {
      console.error('Submission failed silently:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (name: string) => errors.includes(name);

  const RENTING_PRICE_OPTIONS = [
    250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000
  ];

  const BUYING_PRICE_OPTIONS = [
    50000, 100000, 150000, 200000, 250000, 300000, 400000, 500000, 600000, 700000, 800000, 900000,
    1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000, 5000000, 7500000, 10000000
  ];

  const priceOptions = searchMode === 'Buy' ? BUYING_PRICE_OPTIONS : RENTING_PRICE_OPTIONS;

  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000" 
            alt="UK City Architecture"
            className="w-full h-full object-cover brightness-[0.6]"
          />
          <div className="absolute inset-0 bg-primary/20 backdrop-brightness-75"></div>
        </div>

        {/* Content Panel */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-6xl font-serif text-secondary mb-4 font-bold uppercase tracking-tight">
                Find Your Perfect <span className="italic text-accent lowercase">Property</span>
              </h2>
              <p className="text-secondary/70 text-sm md:text-base uppercase tracking-[0.2em]">
                Your trusted partner in finding homes and managing properties
              </p>
            </div>

            {/* Centered Search Panel */}
            <div className="w-full max-w-3xl bg-secondary rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-4 md:p-8 flex flex-col gap-6 relative mx-auto z-30">
              {/* Buy/Rent Toggle */}
              <div className="flex justify-center">
                <div className="bg-primary/5 p-1 rounded-full flex gap-1 w-full max-w-xs">
                  {['Buy', 'Rent'].map((mode) => (
                    <button 
                      key={mode}
                      onClick={() => setSearchMode(mode as 'Buy' | 'Rent')}
                      className={cn(
                        "flex-1 px-4 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all",
                        searchMode === mode ? "bg-primary text-secondary" : "text-primary/40 hover:text-primary"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
                <LocationSearch 
                  value={queryTerm}
                  onChange={setQueryTerm}
                  onSelect={(data) => {
                    setQueryTerm(data.description);
                  }}
                  placeholder="Enter location, area or postcode..."
                  className="sm:col-span-2 md:col-span-12"
                />

                <PriceFilter 
                  label="Min Price"
                  value={minPrice}
                  onChange={setMinPrice}
                  options={priceOptions}
                  className="md:col-span-4"
                />

                <PriceFilter 
                  label="Max Price"
                  value={maxPrice}
                  onChange={setMaxPrice}
                  options={priceOptions}
                  className="md:col-span-4"
                />
                <div className="sm:col-span-2 md:col-span-4">
                  <Link 
                    to={`/search?mode=${searchMode}&q=${encodeURIComponent(queryTerm)}&min=${minPrice}&max=${maxPrice}`}
                    className="w-full bg-accent text-primary h-full py-4 md:py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] md:text-xs hover:bg-accent-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                  >
                    Find Properties
                  </Link>
                </div>
              </div>
            </div>

            {/* Promotional Bold Statements */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <p className="text-accent text-lg md:text-2xl font-black uppercase tracking-[0.2em] text-center drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
                Landlords can list for free
              </p>
               <p className="text-accent text-lg md:text-2xl font-black uppercase tracking-[0.2em] text-center drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
                No guarantor scheme*
              </p>
              <div className="flex flex-col items-center">
                <p className="text-accent/60 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-center -mt-1">
                  Insurance policy applied*
                </p>
                <p className="text-secondary/30 text-[8px] uppercase tracking-[0.3em] mt-1 italic">
                  *Subject to landlord terms and policy coverage
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

            {/* Cities Bar - Vertical Layout */}
            <section className="bg-secondary border-b border-border py-24 md:py-40 lg:py-60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-primary/30 uppercase tracking-[0.5em] mb-8 md:mb-12">Explore Prime UK Locations</span>
            <div className="flex flex-col gap-2 md:gap-4">
              {[
                'London', 'Birmingham', 'Leeds', 'Manchester', 'Bristol', 
                'Glasgow', 'Edinburgh', 'Liverpool', 'Sheffield', 'Cardiff'
              ].map((city, idx) => (
                <motion.div
                  key={city}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <Link 
                    to={`/search?q=${encodeURIComponent(city)}`} 
                    className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-sans font-black text-primary hover:text-[#D4AF37] transition-all duration-300 uppercase tracking-tighter"
                  >
                    {city}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="bg-white py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif text-primary mb-4 font-bold">
              What <span className="italic text-accent">We Do</span>
            </h2>
            <div className="max-w-2xl mx-auto bg-secondary p-8 rounded-3xl border border-border shadow-sm">
              <p className="text-primary/70 leading-relaxed">
                HOE Property Management acts as a specialized branch connecting landlords and tenants. 
                We facilitate high-speed property matching, ensuring both sides reach their best 
                financial decisions through expert valuation and bespoke lettings management.
              </p>
            </div>
          </div>
  
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Buying', icon: HomeIcon },
              { label: 'Selling', icon: Award },
              { label: 'Landlords', icon: ShieldCheck },
              { label: 'Tenants', icon: Clock },
              { 
                label: 'Book Consultation', 
                icon: Search,
                onClick: () => document.getElementById('valuation')?.scrollIntoView({ behavior: 'smooth' })
              },
              { label: 'About', icon: MapPin }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={item.onClick}
                className="flex flex-col items-center gap-4 p-6 bg-secondary rounded-2xl border border-border hover:border-accent group transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-accent transition-colors">
                  <item.icon className="w-5 h-5 text-primary group-hover:text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors text-center">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-24 bg-secondary overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-serif text-primary mb-6 font-bold uppercase tracking-tight">
                Featured <span className="italic text-accent lowercase">Properties</span>
              </h2>
              <p className="text-primary/60 text-sm leading-relaxed font-medium">
                Hand-selected premium properties in the most desirable UK locations. 
                Experience consistent quality across every device.
              </p>
            </div>
            <Link 
              to="/search" 
              className="px-8 py-3 bg-primary text-secondary rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-primary/95 transition-all shadow-xl shadow-primary/10 flex items-center gap-2 group"
            >
              Browse All Listings
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingFeatured ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center">
                 <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                 <p className="text-[10px] text-primary/30 uppercase tracking-widest font-black">Syncing Premium Inventory...</p>
               </div>
            ) : featuredProperties.length > 0 ? featuredProperties.map((property) => (
              <div key={property.id} className="h-full">
                <PropertyCard property={property} />
              </div>
            )) : (
              <div className="col-span-full py-20 bg-white/20 backdrop-blur-sm rounded-[3rem] border border-dashed border-primary/10 flex flex-col items-center justify-center text-center px-6">
                <HomeIcon className="w-16 h-16 text-primary/10 mb-6" />
                <h3 className="text-2xl font-serif italic text-primary/40 mb-2">No Featured Listings</h3>
                <p className="text-[10px] text-primary/30 font-bold uppercase tracking-widest">New properties are arriving shortly. Stay tuned.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Valuation Enquiry Section */}
      <section id="valuation" className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-32">
              <span className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Professional Consultation</span>
              <h2 className="text-4xl md:text-6xl font-serif text-secondary mb-8 font-bold uppercase tracking-tight leading-none">
                Book a <br /> bespoke <span className="italic text-accent lowercase">consultation</span>
              </h2>
              <p className="text-secondary/60 text-base md:text-lg leading-relaxed mb-10 max-w-lg">
                Schedule a bespoke consultation with our property experts. 
                Whether you are looking to let, rent, or invest, we are here to support 
                your real estate goals with verified insight.
              </p>
              
              <div className="space-y-6">
                {[
                  "Personalized expert consultation",
                  "Tailored market strategies"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-secondary/80">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(
              "bg-secondary transition-all duration-700",
              isSubmitted ? "p-4 py-8" : "p-8 md:p-12"
            )} style={{ borderRadius: '2.5rem' }}>
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-20 h-20 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#d4af37]">
                      <ShieldCheck className="w-10 h-10 text-[#d4af37]" />
                    </div>
                    <h3 className="text-2xl font-serif text-primary italic mb-2">Consultation Booking Confirmed</h3>
                    <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em] mb-8">A property expert will be in touch shortly</p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="px-8 py-3 bg-primary text-secondary rounded-full font-bold uppercase tracking-widest text-[10px]"
                    >
                      New Request
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleEnquirySubmit}
                    className="space-y-6"
                    id="valuation-form"
                  >
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block ml-2">I am interested in...</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Selling', 'Letting', 'Both'].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, type: option }))}
                              className={cn(
                                "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                                formData.type === option 
                                  ? "bg-primary text-accent border-accent shadow-lg" 
                                  : "bg-primary/5 border-transparent text-primary/40 hover:bg-primary/10"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {getFieldError('type') && <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest ml-2 mt-1">Please select an option</p>}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block ml-2">Property Details</label>
                          <input 
                            placeholder="Street Address"
                            className={cn(
                              "w-full bg-primary/5 border rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all",
                              getFieldError('address1') ? "border-red-500/50" : "border-primary/5 focus:border-accent"
                            )}
                            value={formData.address1}
                            onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            placeholder="City/Town"
                            className={cn(
                              "w-full bg-primary/5 border rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all",
                              getFieldError('city') ? "border-red-500/50" : "border-primary/5 focus:border-accent"
                            )}
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          />
                          <input 
                            placeholder="Postcode"
                            className={cn(
                              "w-full bg-primary/5 border rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all",
                              getFieldError('postcode') ? "border-red-500/50" : "border-primary/5 focus:border-accent"
                            )}
                            value={formData.postcode}
                            onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block ml-2">Your Contact Information</label>
                        <input 
                          placeholder="Full Name"
                          className={cn(
                            "w-full bg-primary/5 border rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all",
                            getFieldError('name') ? "border-red-500/50" : "border-primary/5 focus:border-accent"
                          )}
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="email"
                            placeholder="Email Address"
                            className={cn(
                              "w-full bg-primary/5 border rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all",
                              getFieldError('email') ? "border-red-500/50" : "border-primary/5 focus:border-accent"
                            )}
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          />
                          <input 
                            type="tel"
                            placeholder="Phone Number"
                            className={cn(
                              "w-full bg-primary/5 border rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all",
                              getFieldError('phone') ? "border-red-500/50" : "border-primary/5 focus:border-accent"
                            )}
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block ml-2">Additional Information</label>
                        <textarea 
                          rows={3}
                          placeholder="E.g. Is the property currently occupied?"
                          className={cn(
                            "w-full bg-primary/5 border rounded-3xl py-4 px-6 text-sm font-medium outline-none transition-all resize-none",
                            getFieldError('enquiryText') ? "border-red-500/50" : "border-primary/5 focus:border-accent"
                          )}
                          value={formData.enquiryText}
                          onChange={(e) => setFormData(prev => ({ ...prev, enquiryText: e.target.value }))}
                        />
                      </div>

                      <div className="flex items-start gap-3 ml-2 group cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, consent: !prev.consent }))}>
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 mt-0.5",
                          formData.consent ? "bg-accent border-accent" : "border-primary/10 group-hover:border-accent/40"
                        )}>
                          {formData.consent && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-[9px] text-primary/40 font-bold leading-relaxed uppercase tracking-widest">
                          I consent to the storage and processing of my personal data for the purpose of booking a consultation.
                        </p>
                      </div>

                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-accent text-primary py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Book Consultation</>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { icon: ShieldCheck, title: "Trusted & Verified", desc: "All listings and landlords are thoroughly vetted for your peace of mind." },
              { icon: Clock, title: "Speed & Efficiency", desc: "Fast applications and instant messaging to secure your perfect home." },
              { icon: Award, title: "Premium Service", desc: "Dedicated support team ensuring excellence in every interaction." },
              { icon: HomeIcon, title: "Expert Local Knowledge", desc: "Deep understanding of the UK's most desirable locations." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-serif mb-3 italic">{feature.title}</h3>
                <p className="text-primary/60 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Split CTA Section */}
      <section className="py-24 border-t border-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="relative aspect-[16/9] md:aspect-[21/9] lg:aspect-auto rounded-3xl overflow-hidden group cursor-pointer h-full"
            >
              <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Tenants" />
              <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] transition-all group-hover:backdrop-blur-none group-hover:bg-primary/20"></div>
              <div className="absolute inset-0 p-12 flex flex-col justify-end">
                <span className="text-accent uppercase tracking-widest text-xs font-bold mb-4">I am a Tenant</span>
                <h3 className="text-4xl text-secondary font-serif italic mb-6">Find your next <br /> sanctuary.</h3>
                <Link to="/tenant" className="w-fit px-8 py-3 bg-secondary text-primary rounded-full font-medium flex items-center gap-2 hover:bg-accent hover:text-secondary transition-all">
                  Tenant Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="relative aspect-[16/9] md:aspect-[21/9] lg:aspect-auto rounded-3xl overflow-hidden group cursor-pointer"
            >
              <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Landlords" />
              <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] transition-all group-hover:backdrop-blur-none group-hover:bg-primary/20"></div>
              <div className="absolute inset-0 p-12 flex flex-col justify-end">
                <span className="text-accent uppercase tracking-widest text-xs font-bold mb-4">I am a Landlord</span>
                <h3 className="text-4xl text-secondary font-serif italic mb-6">Maximize your <br /> investment.</h3>
                <Link to="/landlord" className="w-fit px-8 py-3 bg-secondary text-primary rounded-full font-medium flex items-center gap-2 hover:bg-accent hover:text-secondary transition-all">
                  Landlord Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Confirmation Notification */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm"
          >
            <div className="bg-primary text-secondary p-4 pr-6 rounded-2xl shadow-2xl border border-accent/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-accent mb-0.5">Enquiry Sent</h4>
                <p className="text-[10px] text-secondary/70 font-medium leading-relaxed">
                  Your request has been routed to our consultation team. We will respond shortly.
                </p>
              </div>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors -mr-2"
              >
                <div className="w-2.5 h-2.5 relative">
                  <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-secondary/40 rotate-45 rounded-full" />
                  <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-secondary/40 -rotate-45 rounded-full" />
                </div>
              </button>
            </div>
            {/* Progress bar timer */}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent origin-left rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
