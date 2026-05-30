/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, MapPin, Upload, ImageIcon, 
  ArrowLeft, CheckCircle2, Home, PoundSterling,
  Info, Camera, Sliders, ShieldCheck, Smartphone,
  ArrowRight, Loader2, Plus
} from 'lucide-react';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { storage as firebaseStorage } from '../lib/firebase';
import { ref as firebaseStorageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import IdentityVerification from '../components/IdentityVerification';
import LocationSearch from '../components/LocationSearch';

export default function AddProperty() {
  const isCollapsed = useSidebarCollapse();
  const { profile, user } = useAuth();
  const { showNotification } = useNotification();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Apartment',
    location: '',
    lat: 51.7619,
    lng: -0.2285,
    bedrooms: '1',
    bathrooms: '1',
    encodedUniqueNumber: '',
    isStudent: false,
    isShared: false,
    isBillsIncluded: false,
    billsDescription: '',
    councilTaxBand: '',
    hasParking: false,
    hasGarden: false,
    contactNumber: '',
    description: '',
    floorplan: null as string | null,
    epcEE: '',
    epcEI: '',
    epcCertificate: null as string | null,
    monthlyRent: '',
    securityDeposit: '',
    holdingDeposit: '',
    images: [] as string[],
    noImage: false,
    status: 'Draft' as 'Draft' | 'Live'
  });

  const [uploading, setUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('id');
  const [showDraftResumeBanner, setShowDraftResumeBanner] = useState(false);
  const [cachedDraftData, setCachedDraftData] = useState<any>(null);

  const getFirstMissedStep = (data: typeof formData) => {
    if (!data.title || !data.location) return 1;
    if (!data.description || data.description.length < 50) return 2;
    if (!data.epcCertificate) return 3;
    if (!data.monthlyRent) return 4;
    if (!data.noImage && (!data.images || data.images.length === 0)) return 5;
    return 1;
  };

  // 1. Load draft from database if id is present
  useEffect(() => {
    async function fetchProperty() {
      if (!propertyId || !user) return;
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db: firestoreDb } = await import('../lib/firebase');
        const docRef = doc(firestoreDb, 'properties', propertyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const loadedData = {
            title: data.title || '',
            type: data.type || 'Apartment',
            location: data.location || '',
            lat: data.lat || 51.7619,
            lng: data.lng || -0.2285,
            bedrooms: data.bedrooms ? String(data.bedrooms) : '1',
            bathrooms: data.bathrooms ? String(data.bathrooms) : '1',
            encodedUniqueNumber: data.encodedUniqueNumber || data.referenceNumber || '',
            isStudent: !!data.isStudent,
            isShared: !!data.isShared,
            isBillsIncluded: !!data.isBillsIncluded,
            billsDescription: data.billsDescription || '',
            councilTaxBand: data.councilTaxBand || '',
            hasParking: !!data.hasParking,
            hasGarden: !!data.hasGarden,
            contactNumber: data.contactNumber || '',
            description: data.description || '',
            floorplan: data.floorplan || null,
            epcEE: data.epcEE || '',
            epcEI: data.epcEI || '',
            epcCertificate: data.epcCertificate || null,
            monthlyRent: data.monthlyRent ? String(data.monthlyRent) : '',
            securityDeposit: data.securityDeposit ? String(data.securityDeposit) : '',
            holdingDeposit: data.holdingDeposit ? String(data.holdingDeposit) : '',
            images: data.images || [],
            noImage: !!data.noImage,
            status: data.status || 'Draft'
          };
          setFormData(loadedData);
          
          // Smart resume logic to jump to first missed step
          const missed = getFirstMissedStep(loadedData);
          setStep(missed);
          showNotification("Resumed draft from cloud!", "gold");
        }
      } catch (err) {
        console.error("Error fetching property draft from database:", err);
      }
    }
    fetchProperty();
  }, [propertyId, user]);

  // 2. Check for local storage draft if NO database id is present
  useEffect(() => {
    if (propertyId) return; // Ignore local storage draft if editing a cloud draft
    const savedDraft = localStorage.getItem('hoe_listing_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.description || parsed.monthlyRent || parsed.contactNumber || parsed.images?.length > 0) {
          setCachedDraftData(parsed);
          setShowDraftResumeBanner(true);
        }
      } catch (e) {
        console.error("Failed to parse cached draft", e);
      }
    }
  }, [propertyId]);

  // 3. Silent auto-save to local storage (only for new listings, i.e., no database ID)
  useEffect(() => {
    if (propertyId) return;
    const timer = setTimeout(() => {
      localStorage.setItem('hoe_listing_draft', JSON.stringify(formData));
    }, 5000);
    return () => clearTimeout(timer);
  }, [formData, propertyId]);

  const handleResumeCachedDraft = () => {
    if (cachedDraftData) {
      setFormData(prev => ({ ...prev, ...cachedDraftData }));
      const missed = getFirstMissedStep(cachedDraftData);
      setStep(missed);
      showNotification("Resumed cached progress!", "gold");
    }
    setShowDraftResumeBanner(false);
  };

  const handleClearCachedDraft = () => {
    localStorage.removeItem('hoe_listing_draft');
    setCachedDraftData(null);
    setShowDraftResumeBanner(false);
    showNotification("Draft progress cleared.", "gold");
  };

  const compressAndUploadImage = async (rawFile: File, maxWidth = 1200, quality = 0.8): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(rawFile);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(async (blob) => {
              if (!blob) {
                resolve(null);
                return;
              }
              const compressedFile = new File([blob], rawFile.name.replace(/\.[^/.]+$/, "") + ".jpg", { 
                type: 'image/jpeg' 
              });
              
              const uniqueFileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
              
              try {
                const fRef = firebaseStorageRef(firebaseStorage, `property-images/${user?.uid || 'anonymous'}/${uniqueFileName}`);
                await uploadBytes(fRef, compressedFile);
                const downloadUrl = await getDownloadURL(fRef);
                resolve(downloadUrl);
              } catch (firebaseErr) {
                console.error("Firebase Storage Upload failed:", firebaseErr);
                resolve(null);
              }
            }, 'image/jpeg', quality);
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
      };
      reader.onerror = () => resolve(null);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'images' | 'floorplan' | 'epcCertificate' = 'images') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    if (field === 'images') {
      const filesArray: File[] = Array.from(files);
      const newImages = [...formData.images];

      for (const file of filesArray) {
        if (newImages.length >= 20) break;
        showNotification(`Compressing and uploading ${file.name}...`, "gold");
        const cleanUrl = await compressAndUploadImage(file);
        if (cleanUrl) {
          newImages.push(cleanUrl);
          updateFormData({ images: [...newImages] });
        } else {
          showNotification(`Failed to upload ${file.name}`, "gold");
        }
      }
      setUploading(false);
    } else {
      const file: File = files[0];
      showNotification(`Uploading ${file.name}...`, "gold");
      const cleanUrl = await compressAndUploadImage(file);
      if (cleanUrl) {
        updateFormData({ [field]: cleanUrl });
        showNotification("File uploaded successfully!", "gold");
        if (field === 'epcCertificate') {
          setStep(4);
        }
      } else {
        showNotification(`Failed to upload ${file.name}`, "gold");
      }
      setUploading(false);
    }
  };

  const reorderImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...formData.images];
    const newPos = direction === 'left' ? index - 1 : index + 1;
    if (newPos < 0 || newPos >= newImages.length) return;
    
    [newImages[index], newImages[newPos]] = [newImages[newPos], newImages[index]];
    updateFormData({ images: newImages });
    if (activeImageIndex === index) setActiveImageIndex(newPos);
    else if (activeImageIndex === newPos) setActiveImageIndex(index);
  };

  const deleteImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData({ images: newImages });
    if (activeImageIndex >= newImages.length) {
      setActiveImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handlePublish = async () => {
    if (!user) {
      setError('You must be logged in to publish a listing.');
      return;
    }
    
    setIsPublishing(true);
    setError(null);
    
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      const finalUniqueRef = formData.encodedUniqueNumber || ('HOE-' + Math.floor(100000 + Math.random() * 900000));
      const formattedPriceStr = formData.monthlyRent ? `£${Number(formData.monthlyRent).toLocaleString()} pcm` : 'POA';
      
      const propertyData = {
        title: formData.title || 'HOE Premium Listing',
        type: formData.type,
        location: formData.location || 'Hatfield',
        lat: formData.lat || 51.7619,
        lng: formData.lng || -0.2285,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        encodedUniqueNumber: finalUniqueRef,
        referenceNumber: finalUniqueRef,
        isStudent: formData.isStudent,
        isShared: formData.isShared,
        isBillsIncluded: formData.isBillsIncluded,
        billsDescription: formData.billsDescription,
        councilTaxBand: formData.councilTaxBand,
        hasParking: formData.hasParking,
        hasGarden: formData.hasGarden,
        contactNumber: formData.contactNumber,
        description: formData.description,
        floorplan: formData.floorplan,
        epcEE: formData.epcEE,
        epcEI: formData.epcEI,
        epcCertificate: formData.epcCertificate,
        monthlyRent: formData.monthlyRent,
        price: formattedPriceStr,
        rentNumeric: parseFloat(formData.monthlyRent) || 0,
        securityDeposit: formData.securityDeposit,
        holdingDeposit: formData.holdingDeposit,
        images: formData.images,
        image: formData.images[0] || '',
        noImage: formData.noImage,
        landlordId: localStorage.getItem('impersonated_landlord_id') || user.uid,
        landlordName: localStorage.getItem('impersonated_landlord_name') || profile?.name || user.displayName || 'Landlord',
        created_by: user.uid,
        updatedAt: serverTimestamp(),
        // Normalize search fields for fuzzy matching if needed later
        locationSearch: `${formData.location || ''} ${formData.title || ''}`.toLowerCase(),
        // Ensure status is Live
        status: 'Live'
      };

      if (propertyId) {
        // Update existing draft / property to live
        await updateDoc(doc(db, 'properties', propertyId), propertyData);
        showNotification("Listing published live!", "gold");
      } else {
        // Create new live listing
        await addDoc(collection(db, 'properties'), {
          ...propertyData,
          createdAt: serverTimestamp()
        });
        showNotification("Listing published live!", "gold");
      }
      
      localStorage.removeItem('hoe_listing_draft');
      navigate('/dashboard/landlord/properties');
    } catch (err: any) {
      console.error("Failed to publish property:", err);
      setError('Failed to publish listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) {
      setError('You must be logged in to save a draft.');
      return;
    }
    
    setIsPublishing(true);
    setError(null);
    
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      const finalUniqueRef = formData.encodedUniqueNumber || ('HOE-' + Math.floor(100000 + Math.random() * 900000));
      const formattedPriceStr = formData.monthlyRent ? `£${Number(formData.monthlyRent).toLocaleString()} pcm` : 'POA';
      
      const propertyData = {
        title: formData.title || 'Untitled Property Draft',
        type: formData.type,
        location: formData.location || '',
        lat: formData.lat || 51.7619,
        lng: formData.lng || -0.2285,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        encodedUniqueNumber: finalUniqueRef,
        referenceNumber: finalUniqueRef,
        isStudent: formData.isStudent,
        isShared: formData.isShared,
        isBillsIncluded: formData.isBillsIncluded,
        billsDescription: formData.billsDescription,
        councilTaxBand: formData.councilTaxBand,
        hasParking: formData.hasParking,
        hasGarden: formData.hasGarden,
        contactNumber: formData.contactNumber,
        description: formData.description,
        floorplan: formData.floorplan,
        epcEE: formData.epcEE,
        epcEI: formData.epcEI,
        epcCertificate: formData.epcCertificate,
        monthlyRent: formData.monthlyRent,
        price: formattedPriceStr,
        rentNumeric: formData.monthlyRent ? parseFloat(formData.monthlyRent) : 0,
        securityDeposit: formData.securityDeposit,
        holdingDeposit: formData.holdingDeposit,
        images: formData.images,
        image: formData.images[0] || '',
        noImage: formData.noImage,
        landlordId: localStorage.getItem('impersonated_landlord_id') || user.uid,
        landlordName: localStorage.getItem('impersonated_landlord_name') || profile?.name || user.displayName || 'Landlord',
        created_by: user.uid,
        updatedAt: serverTimestamp(),
        locationSearch: `${formData.location || ''} ${formData.title || ''}`.toLowerCase(),
        status: 'Draft'
      };

      if (propertyId) {
        await updateDoc(doc(db, 'properties', propertyId), propertyData);
        showNotification("Draft saved to cloud!", "gold");
      } else {
        const docRef = await addDoc(collection(db, 'properties'), {
          ...propertyData,
          createdAt: serverTimestamp()
        });
        showNotification("Draft saved to cloud!", "gold");
        // Keep user on editing form but with active ID now
        navigate(`/dashboard/landlord/add?id=${docRef.id}`, { replace: true });
      }
      
      localStorage.removeItem('hoe_listing_draft');
    } catch (err: any) {
      console.error("Failed to save draft:", err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderAdviceNote = (title: string, content: string) => (
    <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl mt-8">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-black uppercase tracking-widest text-accent">{title}</span>
      </div>
      <p className="text-[11px] text-primary/60 italic leading-relaxed">{content}</p>
    </div>
  );

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="space-y-8 bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary mb-8 border-l-4 border-accent pl-4">Property Foundation & Toggles</h3>

              {/* Core Information Section - Title & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-4 block px-2 italic">Property Title *</label>
                  <input 
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="e.g. Stunning 2 Bed Apartment in Hatfield"
                    className="w-full bg-secondary p-5 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-4 block px-2 italic">Primary Location (UK Town/District) *</label>
                  <LocationSearch
                    value={formData.location}
                    onChange={(val) => updateFormData({ location: val })}
                    onSelect={(data) => {
                      updateFormData({
                        location: data.description,
                        lat: data.location?.lat || 51.7619,
                        lng: data.location?.lng || -0.2285
                      });
                    }}
                    placeholder="e.g. Hatfield or South Hatfield"
                  />
                </div>
              </div>

              {/* Specs Grid - Property Type, Bedrooms, Bathrooms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-4 block px-2 italic">Property Type *</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => updateFormData({ type: e.target.value })}
                    className="w-full bg-secondary p-5 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Flat">Flat</option>
                    <option value="Detached">Detached</option>
                    <option value="Terrace">Terrace</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-4 block px-2 italic">Bedrooms *</label>
                  <select 
                    value={formData.bedrooms}
                    onChange={(e) => updateFormData({ bedrooms: e.target.value })}
                    className="w-full bg-secondary p-5 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                  >
                    <option value="0">Studio (0 Beds)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Bedroom' : 'Bedrooms'}</option>
                    ))}
                    <option value="13">12+ Bedrooms</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-4 block px-2 italic">Bathrooms *</label>
                  <select 
                    value={formData.bathrooms}
                    onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                    className="w-full bg-secondary p-5 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                  >
                    <option value="0">En-suite</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Bathroom' : 'Bathrooms'}</option>
                    ))}
                    <option value="9">8+ Bathrooms</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'isShared', label: 'Shared Accommodation', desc: 'Listing for individual rooms' },
                  { id: 'isStudent', label: 'Student Housing', desc: 'Tags as student friendly' },
                  { id: 'isBillsIncluded', label: 'Bills Included', desc: 'Utilities included in rent' }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-6 bg-secondary rounded-[2rem] border border-primary/5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary">{item.label}</p>
                      <p className="text-[10px] text-primary/40 uppercase font-bold tracking-tighter">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => updateFormData({ [item.id]: !formData[item.id as keyof typeof formData] })}
                      className={cn(
                        "w-14 h-8 rounded-full p-1 transition-all",
                        formData[item.id as keyof typeof formData] ? "bg-accent" : "bg-primary/20"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 bg-white rounded-full transition-all shadow-sm",
                        formData[item.id as keyof typeof formData] ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                ))}
              </div>

              {formData.isBillsIncluded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-accent mb-2 block px-4 italic">Bills Description</label>
                  <textarea 
                    value={formData.billsDescription}
                    onChange={(e) => updateFormData({ billsDescription: e.target.value })}
                    className="w-full bg-secondary p-6 rounded-[2rem] outline-none focus:ring-2 ring-accent transition-all font-medium text-primary border border-primary/10 h-32" 
                    placeholder="e.g. Water and Wi-Fi included..." 
                  />
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center justify-between p-6 bg-secondary rounded-3xl border border-primary/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Private Garden</span>
                  <button 
                    onClick={() => updateFormData({ hasGarden: !formData.hasGarden })}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all",
                      formData.hasGarden ? "bg-accent text-secondary" : "bg-primary/5 text-primary/30"
                    )}
                  >
                    {formData.hasGarden ? 'Yes' : 'No'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-6 bg-secondary rounded-3xl border border-primary/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Parking Included</span>
                  <button 
                    onClick={() => updateFormData({ hasParking: !formData.hasParking })}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all",
                      formData.hasParking ? "bg-accent text-secondary" : "bg-primary/5 text-primary/30"
                    )}
                  >
                    {formData.hasParking ? 'Yes' : 'No'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">Council Tax Band</label>
                  <select 
                    value={formData.councilTaxBand}
                    onChange={(e) => updateFormData({ councilTaxBand: e.target.value })}
                    className="w-full bg-secondary p-5 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                  >
                    <option value="">Select Band</option>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(band => (
                      <option key={band} value={band}>Band {band}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">Contact Number</label>
                  <input 
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => updateFormData({ contactNumber: e.target.value })}
                    placeholder="e.g. 07700 900000"
                    className="w-full bg-secondary p-5 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                  />
                </div>
              </div>

              {renderAdviceNote(
                "HMO Compliance",
                "If renting to 3+ unrelated people (Shared Accommodation), you must hold a valid HMO License from your local council. Failure to do so may result in Rent Repayment Orders of up to 12 months' rent."
              )}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="space-y-8 bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary mb-8 border-l-4 border-accent pl-4">Narrative & Floorplans</h3>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">Property Description *</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  className="w-full bg-secondary p-10 rounded-[3rem] outline-none focus:ring-2 ring-accent transition-all font-medium text-primary border border-primary/10 h-64" 
                  placeholder="Describe your property in detail (Min 50 characters)..." 
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">Floorplan Attachment (Optional)</label>
                <div 
                  onClick={() => document.getElementById('floorplan-upload')?.click()}
                  className={cn(
                    "p-12 bg-secondary rounded-[2.5rem] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-center",
                    formData.floorplan && "border-green-500/30 bg-green-50/10"
                  )}
                >
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    {formData.floorplan ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <Upload className="w-8 h-8 text-accent" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{formData.floorplan ? 'Floorplan Uploaded' : 'Upload Floorplan'}</p>
                    <p className="text-[9px] text-primary/30 mt-1 font-bold uppercase">PDF, JPG or PNG</p>
                  </div>
                  <input id="floorplan-upload" type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleImageChange(e, 'floorplan')} />
                </div>
              </div>

              {renderAdviceNote(
                "Visual Accuracy",
                "Professional floorplans are the #1 tool for reducing wasted viewings. Ensure all room dimensions are provided to avoid 'misleading action' claims under Consumer Protection Regulations."
              )}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="space-y-8 bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary mb-8 border-l-4 border-accent pl-4">EPC Compliance & Documentation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 text-center block">EE Rating (Energy Efficiency)</label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r => (
                      <button 
                        key={r}
                        onClick={() => updateFormData({ epcEE: r })}
                        className={cn(
                          "h-10 rounded-xl flex items-center justify-center font-black transition-all text-xs",
                          formData.epcEE === r ? "bg-green-600 text-white scale-110 shadow-lg" : "bg-secondary text-primary/30"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 text-center block">EI Rating (Environmental Impact)</label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r => (
                      <button 
                        key={r}
                        onClick={() => updateFormData({ epcEI: r })}
                        className={cn(
                          "h-10 rounded-xl flex items-center justify-center font-black transition-all text-xs",
                          formData.epcEI === r ? "bg-blue-600 text-white scale-110 shadow-lg" : "bg-secondary text-primary/30"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">EPC Certificate Attachment *</label>
                <div 
                  onClick={() => document.getElementById('epc-upload')?.click()}
                  className={cn(
                    "p-12 bg-secondary rounded-[2.5rem] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-center",
                    formData.epcCertificate && "border-green-500/30 bg-green-50/10"
                  )}
                >
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    {formData.epcCertificate ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <ShieldCheck className="w-8 h-8 text-accent" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{formData.epcCertificate ? 'Certificate Attached' : 'Attach EPC Certificate'}</p>
                    <p className="text-[9px] text-primary/30 mt-1 font-bold uppercase">Official EPC Image or PDF</p>
                  </div>
                  <input id="epc-upload" type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleImageChange(e, 'epcCertificate')} />
                </div>
              </div>

              {renderAdviceNote(
                "Assessor Search",
                "If you do not have a valid EPC, you must contact a Domestic Energy Assessor (DEA) via the Official Government Register (gov.uk/find-energy-certificate). Properties below EPC E cannot be legally let without a registered exemption."
              )}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="space-y-8 bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary mb-8 border-l-4 border-accent pl-4">Pricing & Financials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">Monthly Rent *</label>
                  <div className="relative">
                    <PoundSterling className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                    <input 
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => updateFormData({ monthlyRent: e.target.value })}
                      placeholder="PCM"
                      className="w-full bg-secondary p-5 pl-14 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">Security Deposit (Max 5 wks)</label>
                  <div className="relative">
                    <PoundSterling className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10" />
                    <input 
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => updateFormData({ securityDeposit: e.target.value })}
                      placeholder="e.g. 1500"
                      className="w-full bg-secondary p-5 pl-14 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-4 block px-2">Holding Deposit (Max 1 wk)</label>
                <div className="relative max-w-md">
                  <PoundSterling className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10" />
                  <input 
                    type="number"
                    value={formData.holdingDeposit}
                    onChange={(e) => updateFormData({ holdingDeposit: e.target.value })}
                    placeholder="e.g. 300"
                    className="w-full bg-secondary p-5 pl-14 rounded-2xl outline-none border border-primary/10 focus:ring-2 ring-accent font-bold text-sm"
                  />
                </div>
              </div>

              {renderAdviceNote(
                "Payment Limits",
                "Under the Renters' Rights Act 2026, you cannot accept rental 'bidding' above the advertised price. Holding deposits must be refunded or applied to rent within 15 days."
              )}
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="space-y-8 bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-2xl shadow-primary/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary border-l-4 border-accent pl-4">Media & Gallery</h3>
                <div className="flex items-center gap-4 px-6 py-3 bg-secondary rounded-full border border-primary/5">
                   <div className="flex items-center gap-2">
                     <ImageIcon className="w-4 h-4 text-primary/30" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">No Image Placeholder</span>
                   </div>
                   <button 
                    onClick={() => updateFormData({ noImage: !formData.noImage })}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-all",
                      formData.noImage ? "bg-accent" : "bg-primary/20"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      formData.noImage ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>

              {formData.noImage ? (
                <div className="p-20 bg-primary rounded-[3rem] text-center border-4 border-accent border-dashed flex flex-col items-center gap-6 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                   <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center relative z-10 animate-pulse">
                     <Building className="w-12 h-12 text-accent" />
                   </div>
                   <h4 className="text-4xl font-serif italic text-accent tracking-tighter relative z-10">Premium Placeholder</h4>
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary/40 max-w-xs relative z-10 leading-relaxed">System will display high-fidelity 'No Image' graphic to maintain brand aesthetic</p>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      onClick={() => document.getElementById('gallery-upload')?.click()}
                      className="p-16 bg-secondary rounded-[3rem] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center gap-6 group cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-center relative"
                    >
                      <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-accent/5">
                        <Upload className="w-10 h-10 text-accent" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Import Gallery</p>
                        <p className="text-[10px] text-primary/30 mt-2 font-bold uppercase tracking-widest">JPG, PNG or WEBP (Max 20)</p>
                      </div>
                      <input id="gallery-upload" type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(e)} />
                    </div>

                    <div 
                      onClick={() => document.getElementById('camera-capture')?.click()}
                      className="p-16 bg-secondary rounded-[3rem] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center gap-6 group cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-center relative"
                    >
                      <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-accent/5">
                        <Camera className="w-10 h-10 text-accent" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Capture Phase</p>
                        <p className="text-[10px] text-primary/30 mt-2 font-bold uppercase tracking-widest">Use device sensors</p>
                      </div>
                      <input id="camera-capture" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageChange(e)} />
                    </div>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="space-y-10">
                      <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-black shadow-2xl group">
                        <AnimatePresence mode="wait">
                          <motion.img 
                            key={`carousel-image-${activeImageIndex}-${formData.images[activeImageIndex]?.slice(-40) || 'placeholder'}`}
                            src={formData.images[activeImageIndex]}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full object-cover"
                          />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="absolute top-8 left-8 flex gap-3">
                           <div className="px-4 py-2 bg-accent text-primary text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                             Preview Phase
                           </div>
                           <div className="px-4 py-2 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10">
                             Image {activeImageIndex + 1} of {formData.images.length}
                           </div>
                        </div>

                        <div className="absolute bottom-8 left-8 flex gap-3">
                          <button 
                            onClick={() => reorderImage(activeImageIndex, 'left')}
                            disabled={activeImageIndex === 0}
                            className="p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 transition-all disabled:opacity-0"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => reorderImage(activeImageIndex, 'right')}
                            disabled={activeImageIndex === formData.images.length - 1}
                            className="p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 transition-all disabled:opacity-0"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteImage(activeImageIndex)}
                            className="p-4 bg-red-500/80 backdrop-blur-md text-white rounded-2xl hover:bg-red-600 transition-all"
                          >
                            <Plus className="w-5 h-5 rotate-45" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                        {formData.images.map((img, i) => {
                          const uniqueImageKey = `uploaded-media-${img.slice(-40) || 'file'}-${i}`;
                          return (
                            <button 
                              key={uniqueImageKey}
                              onClick={() => setActiveImageIndex(i)}
                              className={cn(
                                "aspect-square rounded-2xl overflow-hidden border-2 transition-all relative group",
                                activeImageIndex === i ? "border-accent scale-110 shadow-xl z-10" : "border-transparent opacity-50 hover:opacity-100"
                              )}
                            >
                              <img src={img} className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                        {formData.images.length < 20 && (
                          <button 
                            onClick={() => document.getElementById('gallery-upload')?.click()}
                            className="aspect-square rounded-2xl border-2 border-dashed border-primary/10 flex items-center justify-center text-primary/20 hover:border-accent hover:text-accent transition-all bg-secondary/30"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && (!formData.title.trim() || !formData.location.trim())) return true;
    if (step === 2 && formData.description.length < 50) return true;
    if (step === 3 && (uploading || !formData.epcCertificate)) return true;
    if (step === 4 && !formData.monthlyRent) return true;
    if (step === 5 && !formData.noImage && formData.images.length === 0) return true;
    if (step === 5 && !user?.emailVerified) return true;
    return false;
  };

  return (
    <div className="bg-secondary min-h-screen">
      <Sidebar type="landlord" />
      
      <div className={cn(
        "pt-10 pb-32 px-4 sm:px-6 lg:px-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
        <div className="max-w-4xl mx-auto">
          {/* Custom Premium Verification Popover/Draft Resume Banner */}
          <AnimatePresence>
            {showDraftResumeBanner && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-[6px]"
              >
                <div className="bg-white border-2 border-accent p-10 rounded-[3rem] max-w-lg w-full shadow-2xl relative text-center flex flex-col items-center gap-6">
                  <button 
                    onClick={handleClearCachedDraft}
                    className="absolute top-6 right-6 text-primary/40 hover:text-accent font-bold text-2xl"
                  >
                    &times;
                  </button>
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                    <Building className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-3xl font-serif italic text-primary">Resume Listing</h3>
                  <p className="text-primary/60 text-xs font-medium uppercase tracking-[0.1em] leading-relaxed">
                    We found an unfinished listing in your local session cache. Would you like to continue building it?
                  </p>
                  <div className="flex gap-4 w-full justify-center mt-4">
                    <button
                      type="button"
                      onClick={handleResumeCachedDraft}
                      className="px-8 py-4 bg-primary text-accent rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-primary transition-all shadow-lg active:scale-95"
                    >
                      Yes, Resume
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCachedDraft}
                      className="px-8 py-4 bg-secondary text-primary/40 hover:text-red-500 rounded-full font-black uppercase tracking-[0.2em] text-[10px] transition-all border border-primary/5 active:scale-95"
                    >
                      No, Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <header className="flex flex-col gap-6 mb-16">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border-l-4 border-red-500 p-6 rounded-r-3xl flex items-center gap-4 mb-4"
              >
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">!</span>
                </div>
                <p className="text-red-500 text-xs font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </motion.div>
            )}

            {!user?.emailVerified && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#ffebeb] border border-[#ff4444]/40 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#ff4444]/10 rounded-full flex items-center justify-center flex-shrink-0 border border-[#ff4444]/20">
                    <span className="text-[#ff4444] text-lg font-bold">⚠️</span>
                  </div>
                  <div>
                    <h4 className="text-[#ff4444] text-[11px] font-black uppercase tracking-widest leading-none mb-1">Email Verification Required</h4>
                    <p className="text-[#ff4444]/70 text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                      You must verify your email address to publish properties. Your landlord listing options are currently locked.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const { sendEmailVerification } = await import('firebase/auth');
                      const { auth } = await import('../lib/firebase');
                      if (auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        showNotification("Verification email resent!", "gold");
                      } else {
                        showNotification("Failed to resend. Please login again.", "red");
                      }
                    } catch (err: any) {
                      showNotification("Failed to resend. Please retry.", "red");
                    }
                  }}
                  className="px-6 py-2.5 bg-[#ff4444] text-white hover:bg-black rounded-full font-black uppercase tracking-widest text-[9px] transition-all self-start md:self-auto"
                >
                  Resend Email
                </button>
              </motion.div>
            )}
            <Link 
              to="/dashboard/landlord/properties"
              className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-primary/40 hover:text-accent transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Properties Directory
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-6xl md:text-7xl font-serif italic text-primary leading-tight tracking-tighter">HOE Property Management <span className="text-accent underline decoration-primary/10">Listing</span></h1>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-accent mt-2 italic">House of Eden</p>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 mt-4 pl-1 border-l-2 border-accent">Secure Landlord Deployment System</p>
              </div>
              <div className="flex gap-3 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={cn(
                    "w-14 h-2 rounded-full transition-all duration-700",
                    step === s ? "bg-accent scale-x-110 shadow-lg shadow-accent/20" : step > s ? "bg-primary" : "bg-primary/10"
                  )} />
                ))}
              </div>
            </div>
          </header>

          <div className="mb-16">
            {renderStep()}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50 backdrop-blur-xl p-8 rounded-[3.5rem] border border-primary/5 shadow-2xl relative z-10">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard/landlord/properties')}
              className="w-full sm:w-auto px-8 py-5 text-primary/40 font-black uppercase tracking-[0.3em] text-[10px] hover:text-primary transition-all rounded-full border border-primary/5 shadow-sm active:scale-95 text-center"
            >
              {step === 1 ? 'Terminate Draft' : 'Return Phase'}
            </button>

            <button 
              type="button"
              onClick={handleSaveDraft}
              disabled={isPublishing}
              className="w-full sm:w-auto px-8 py-5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-primary rounded-full font-black uppercase tracking-[0.3em] text-[10px] transition-all border border-[#D4AF37]/20 shadow-sm active:scale-95 disabled:opacity-50 text-center"
            >
              Save to Draft
            </button>
            
            <button 
              onClick={() => step < 5 ? setStep(step + 1) : handlePublish()}
              disabled={isNextDisabled() || isPublishing}
              className="w-full sm:w-auto px-10 py-5 bg-primary text-accent rounded-full font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-primary/30 hover:bg-black hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none text-center"
            >
              {isPublishing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 5 ? (
                "Publish Live Listing"
              ) : (
                <>Advance System <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
      <BottomNav type="landlord" />
    </div>
  );
}
