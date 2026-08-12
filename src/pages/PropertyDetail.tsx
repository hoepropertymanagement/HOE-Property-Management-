import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Heart, 
  Share2, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar, 
  MessageSquare, 
  CheckCircle,
  Clock,
  User,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function PropertyDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Component States
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  
  // Modal & Interaction States
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('');
  const [viewingBooked, setViewingBooked] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  // Mock Property Data
  const property = {
    id: id || '1',
    title: 'Modern Luxury Apartment with Panoramic City Views',
    address: '124 Kensington High Street, London, W8 7RG',
    price: '£3,500 pcm',
    deposit: '£4,038',
    beds: 2,
    baths: 2,
    sqft: 950,
    availableFrom: 'Immediate',
    type: 'Apartment',
    description: 'A stunning modern two-bedroom, two-bathroom apartment situated on the 5th floor of this prestigious development. Features open-plan living, private balcony, floor-to-ceiling windows, and luxury finishes throughout.',
    landlordId: 'landlord_101',
    landlordName: 'Sarah Jenkins',
    landlordResponseTime: 'Under 1 hour',
    landlordRating: '4.9',
    verified: true,
    features: [
      'Private Balcony',
      '24/7 Concierge',
      'Underfloor Heating',
      'Fully Furnished',
      'Resident Gym',
      'Secure Underground Parking'
    ],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000'
    ]
  };

  const carouselImages = property.images && property.images.length > 0 ? property.images : ['https://via.placeholder.com/800x600'];

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % carouselImages.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, carouselImages.length]);

  // FIX FOR MESSAGE LANDLORD: Pass landlord state to the messages page
  const handleMessageLandlord = () => {
    setIsMessaging(true);
    setTimeout(() => {
      setIsMessaging(false);
      navigate('/dashboard/tenant/messages', {
        state: {
          recipientId: property.landlordId,
          recipientName: property.landlordName,
          propertyId: property.id,
          propertyTitle: property.title,
          initialMessage: `Hi ${property.landlordName}, I'm interested in viewing standard details for ${property.title}.`
        }
      });
    }, 400);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleViewingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setViewingBooked(true);
    setTimeout(() => {
      setViewingBooked(false);
      setShowViewingModal(false);
      setViewingDate('');
      setViewingTime('');
    }, 2000);
  };

  const renderPrice = () => {
    if (typeof property.price === 'string') {
      const parts = property.price.split(' ');
      return (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl md:text-5xl font-bold">{parts[0]}</span>
          {parts[1] && <span className="text-emerald-600 font-semibold text-base md:text-lg">{parts[1]}</span>}
        </div>
      );
    }
    return <span className="text-4xl md:text-5xl font-bold">£{property.price}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-6 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-6">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Search
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Share Property"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2.5 rounded-full bg-white shadow-sm border border-slate-200 transition-colors ${isSaved ? 'text-rose-500' : 'text-slate-600 hover:text-slate-900'}`}
              title="Save Property"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Gallery & Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <div 
                className="relative h-[380px] md:h-[480px] w-full rounded-2xl overflow-hidden shadow-md cursor-pointer group bg-slate-200"
                onClick={() => { setLightboxIndex(activeImage); setIsLightboxOpen(true); }}
              >
                <img 
                  src={carouselImages[activeImage]} 
                  alt={property.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <span className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Click to Expand ({activeImage + 1}/{carouselImages.length})
                </span>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                {carouselImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-20 md:h-24 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === idx ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Overview Header */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs tracking-wider uppercase mb-2">
                  <span>{property.type}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold">Available {property.availableFrom}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{property.title}</h1>
                <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-2">
                  <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                  {property.address}
                </p>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Bedrooms</p>
                    <p className="text-sm font-bold text-slate-800">{property.beds} Beds</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Bathrooms</p>
                    <p className="text-sm font-bold text-slate-800">{property.baths} Baths</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                    <Square className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Area</p>
                    <p className="text-sm font-bold text-slate-800">{property.sqft} sq ft</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">About this home</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">Key Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {property.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md sticky top-6 space-y-6">
              
              <div className="pb-6 border-b border-slate-100">
                {renderPrice()}
                <p className="text-xs text-slate-400 mt-1">Deposit: {property.deposit}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  type="button"
                  onClick={() => setShowViewingModal(true)}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Calendar className="w-4 h-4" /> Book a Viewing
                </button>
                <button 
                  type="button"
                  onClick={handleMessageLandlord}
                  disabled={isMessaging}
                  className="w-full py-3.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  {isMessaging ? 'Opening Conversation...' : 'Message Landlord'}
                </button>
              </div>

              {/* Landlord Info */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-slate-900">{property.landlordName}</span>
                      {property.verified && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Replies in {property.landlordResponseTime}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* --- MODALS & TOASTS --- */}

      {/* 1. Book Viewing Modal */}
      <AnimatePresence>
        {showViewingModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative z-[10000]"
            >
              <button 
                type="button"
                onClick={() => setShowViewingModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>

              {!viewingBooked ? (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Schedule a Viewing</h3>
                  <p className="text-sm text-slate-500 mb-6">Choose a date and time to visit this property.</p>

                  <form onSubmit={handleViewingConfirm} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Preferred Date</label>
                      <input 
                        type="date" 
                        required
                        value={viewingDate}
                        onChange={(e) => setViewingDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Preferred Time</label>
                      <input 
                        type="time" 
                        required
                        value={viewingTime}
                        onChange={(e) => setViewingTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => setShowViewingModal(false)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        Confirm Request
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Viewing Requested!</h4>
                  <p className="text-xs text-slate-500">The landlord has been notified and will confirm shortly.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          >
            <button 
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>

            <button 
              type="button"
              onClick={() => setLightboxIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
              className="absolute left-6 text-white/80 hover:text-white p-3 rounded-full bg-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img 
              src={carouselImages[lightboxIndex]} 
              alt="" 
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            />

            <button 
              type="button"
              onClick={() => setLightboxIndex((prev) => (prev + 1) % carouselImages.length)}
              className="absolute right-6 text-white/80 hover:text-white p-3 rounded-full bg-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-[9999]"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}