import React, { useState, useEffect, useRef } from 'react';
import { useAuth, EcosystemRole } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, FileText, Shield, Save, Camera, ToggleLeft as Toggle, Loader2, CheckCircle2, Image as ImageIcon, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import IdentityVerification from '../components/IdentityVerification';
import { cn } from '../lib/utils';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfilePage() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    contactNumber: '',
    isPublicContact: false,
    showPhoneNumber: false,
    showEmail: false,
    photoURL: '',
    role: 'tenant' as EcosystemRole
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVerify, setShowVerify] = useState<{ type: 'phone' | 'email'; value: string } | null>(null);

  const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twighlightani113@gmail.com', 'twiglightani113@gmail.com', 'nkeface14@gmail.com'];
  const isAgentUser = (user?.email || profile?.email) && allowedAgentEmails.includes((user?.email || profile?.email || '').toLowerCase());

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        contactNumber: profile.contactNumber || '',
        isPublicContact: profile.isPublicContact || false,
        showPhoneNumber: profile.showPhoneNumber || false,
        showEmail: profile.showEmail || false,
        photoURL: profile.photoURL || '',
        role: profile.role || 'tenant'
      });
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
      await updateProfile({ photoURL: url });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.warn("Error uploading photo, utilizing base64 metadata fallback:", error);
      // Fallback: save the base64 photoURL directly into Firestore!
      const fallbackReader = new FileReader();
      fallbackReader.onloadend = async () => {
        const b64 = fallbackReader.result as string;
        if (b64) {
          try {
            setFormData(prev => ({ ...prev, photoURL: b64 }));
            await updateProfile({ photoURL: b64 });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
          } catch (dbErr) {
            console.error("Failed to save base64 fallback photo profile:", dbErr);
          }
        }
      };
      fallbackReader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Save profile error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a1a0f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
             <Link 
              to="/dashboard" 
              className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-accent/60 hover:text-accent transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard Gateway
            </Link>
            <h1 className="text-6xl md:text-7xl font-serif italic text-accent leading-tight tracking-tighter">
              User <span className="text-secondary underline decoration-accent/20">Identity</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/30 pl-2 border-l-2 border-accent">HOE Property Management</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.6em] text-accent mt-2 pl-2 italic">House of Eden</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "px-10 py-5 rounded-full font-black uppercase tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-4 shadow-2xl",
              success 
                ? "bg-green-600 text-white" 
                : "bg-accent text-primary hover:bg-black hover:text-accent shadow-accent/20"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <>Identity Secured <CheckCircle2 className="w-4 h-4" /></>
            ) : (
              <>Secure Changes <Save className="w-4 h-4" /></>
            )}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-[#1b3022] p-10 rounded-[3.5rem] shadow-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors" />
              
              <div className="relative z-10 text-center">
                <div className={cn(
                  "w-40 h-40 mx-auto rounded-[3rem] bg-black/20 overflow-hidden relative mb-8 transition-all duration-700 rotate-3 group-hover:rotate-0 flex items-center justify-center",
                  isAgentUser 
                    ? "ring-4 ring-blue-500 ring-offset-4 ring-offset-[#1b3022] shadow-[0_0_20px_rgba(59,130,246,0.65)]" 
                    : "border-4 border-accent/20 group-hover:border-accent"
                )}>
                  {(formData.photoURL || profile?.photoURL) ? (
                    <img src={formData.photoURL || profile?.photoURL} alt={formData.name} className="w-full h-full object-cover transition-all duration-700" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-accent text-5xl font-serif italic">
                      {formData.name?.[0] || 'U'}
                    </div>
                  )}
                  {uploading ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center text-accent gap-2"
                    >
                      <Camera className="w-8 h-8" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Update Vessel</span>
                    </button>
                  )}
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <h2 className="text-3xl font-serif italic text-accent truncate">{formData.name || 'Anonymous User'}</h2>
                <p className="text-secondary/40 text-[9px] font-black uppercase tracking-[0.3em] mt-3">{profile?.email}</p>
                {formData.role && (
                  <div className="mt-4 inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5">
                    <p className="text-accent text-[9px] font-black uppercase tracking-[0.2em]">
                      {formData.role === 'both' ? 'LANDLORD & TENANT' : formData.role}
                    </p>
                  </div>
                )}
                
                <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between group/toggle">
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Phone Visibility</p>
                      <p className="text-[8px] text-accent/40 uppercase font-bold tracking-tighter">Display on contact forms</p>
                    </div>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, showPhoneNumber: !prev.showPhoneNumber }))}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-all",
                        formData.showPhoneNumber ? "bg-accent shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "bg-black/40"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500",
                        formData.showPhoneNumber ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between group/toggle">
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Email Visibility</p>
                      <p className="text-[8px] text-accent/40 uppercase font-bold tracking-tighter">Display on listings</p>
                    </div>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, showEmail: !prev.showEmail }))}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-all",
                        formData.showEmail ? "bg-accent shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "bg-black/40"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500",
                        formData.showEmail ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1b3022] p-10 md:p-16 rounded-[3.5rem] shadow-2xl border border-white/5 space-y-12">
              <div className="space-y-10">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-accent border-l-4 border-accent pl-6">Core Personality</h3>
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30 flex items-center gap-3 px-2">
                       <User className="w-3.5 h-3.5 text-accent" /> Public Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-black/20 border border-white/5 rounded-3xl py-6 px-8 text-lg font-serif italic outline-none focus:border-accent focus:bg-black/40 transition-all text-secondary"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Alistair Eden"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30 flex items-center gap-3 px-2">
                       <FileText className="w-3.5 h-3.5 text-accent" /> Professional Bio
                    </label>
                    <textarea
                      rows={5}
                      className="w-full bg-black/20 border border-white/5 rounded-[2.5rem] py-6 px-8 text-sm md:text-base outline-none focus:border-accent focus:bg-black/40 transition-all text-secondary font-medium resize-none leading-relaxed"
                      value={formData.bio}
                      placeholder="Describe your property requirements or portfolio style..."
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-10 pt-12 border-t border-white/5">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-accent border-l-4 border-accent pl-6">Ecosystem Role</h3>
                <p className="text-secondary/60 text-xs px-2 -mt-6">Choose how you'd like to access and navigate the House of Eden ecosystem. This determines your primary dashboard view.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                  {[
                    { id: 'tenant', label: 'Tenant Portal', desc: 'Searching for home' },
                    { id: 'landlord', label: 'Landlord Portal', desc: 'Property management' },
                    { id: 'both', label: 'Dual Access Portal', desc: 'Access both portals' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: r.id as any }))}
                      className={cn(
                        "p-5 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-2 cursor-pointer relative overflow-hidden",
                        formData.role === r.id 
                          ? "bg-accent/15 border-accent text-accent shadow-lg shadow-accent/5" 
                          : "bg-black/20 border-transparent text-secondary/40 hover:border-white/10 hover:bg-black/30"
                      )}
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest">{r.label}</span>
                      <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest text-ellipsis overflow-hidden whitespace-nowrap">{r.desc}</span>
                    </button>
                  ))}
                </div>

                {isAgentUser && (
                  <div className="space-y-6 pt-10 px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Agent Promotion (Admin Only)</h3>
                    <div className="flex items-center justify-between p-6 bg-black/30 rounded-[2rem] border border-accent/30 group/toggle">
                      <div className="text-left">
                        <p className="text-[11px] font-black uppercase tracking-widest text-accent mb-0.5">Make Agent</p>
                        <p className="text-[9px] text-secondary/60 uppercase font-bold tracking-wide">Promote to Agent access level</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: prev.role === 'agent' ? 'landlord' : 'agent' }))}
                        className={cn(
                          "w-14 h-7 rounded-full relative transition-all outline-none",
                          formData.role === 'agent' ? "bg-accent shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "bg-black"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-5 h-5 rounded-full transition-all duration-300",
                          formData.role === 'agent' ? "bg-[#140526] right-1" : "bg-secondary/40 left-1"
                        )} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-10 pt-12 border-t border-white/5">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-accent border-l-4 border-accent pl-6">Communication Bridge</h3>
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30 flex items-center justify-between px-2">
                      <span className="flex items-center gap-3"><Phone className="w-3.5 h-3.5 text-accent" /> Secure Phone</span>
                      {profile?.isPhoneVerified && <span className="text-accent flex items-center gap-1 italic"><ShieldCheck className="w-3 h-3" /> Encrypted</span>}
                    </label>
                    <div className="relative group">
                      <input
                        type="tel"
                        className="w-full bg-black/20 border border-white/5 rounded-3xl py-6 px-8 text-lg font-serif italic outline-none focus:border-accent focus:bg-black/40 transition-all text-secondary"
                        value={formData.contactNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 11) setFormData(prev => ({ ...prev, contactNumber: val }));
                        }}
                        placeholder="07700 900123"
                      />
                      {!profile?.isPhoneVerified && formData.contactNumber.length === 11 && (
                        <button 
                          type="button"
                          onClick={() => setShowVerify({ type: 'phone', value: formData.contactNumber })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-3 bg-accent text-primary rounded-2xl font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all shadow-lg outline-none"
                        >
                          Verify System
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30 flex items-center justify-between px-2">
                      <span className="flex items-center gap-3"><Mail className="w-3.5 h-3.5 text-accent" /> Primary Channel</span>
                      <span className="text-accent flex items-center gap-1 italic"><ShieldCheck className="w-3 h-3" /> Verified</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        className="w-full bg-black/10 border border-white/5 rounded-3xl py-6 px-8 text-lg font-serif italic transition-all text-secondary/40 cursor-not-allowed"
                        value={profile?.email || ''}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowVerify({ type: 'email', value: profile?.email || '' })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-3 bg-white/5 text-accent rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all outline-none"
                      >
                        Rotate Key
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showVerify && (
        <IdentityVerification 
          type={showVerify.type}
          value={showVerify.value}
          onSuccess={() => {
            setShowVerify(null);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
          }}
          onCancel={() => setShowVerify(null)}
        />
      )}
    </div>
  );
}
