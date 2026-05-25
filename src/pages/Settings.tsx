import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  User, Mail, Phone, MapPin, Shield, Map as MapIcon, 
  Settings as SettingsIcon, LogOut, Trash2, 
  ChevronRight, Save, Loader2, CheckCircle2,
  Lock, Bell, Smartphone, Globe, Home, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import LogoutModal from '../components/LogoutModal';

type SettingsTab = 'account' | 'contact' | 'preferences' | 'security';

export default function Settings() {
  const isCollapsed = useSidebarCollapse();
  const { profile, updateProfile, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // ... rest of the state ...
  const [formData, setFormData] = useState({
    role: profile?.role || 'tenant' as 'tenant' | 'landlord' | 'both',
    contactNumber: profile?.contactNumber || '',
    address: profile?.address || '',
    searchRadius: profile?.searchRadius || '15',
    emailNotifications: profile?.emailNotifications ?? true,
    smsNotifications: profile?.smsNotifications ?? false,
    pushNotifications: profile?.pushNotifications ?? true,
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        role: profile.role || 'tenant',
        contactNumber: profile.contactNumber || '',
        address: profile.address || '',
        searchRadius: profile.searchRadius || '15',
        emailNotifications: profile.emailNotifications ?? true,
        smsNotifications: profile.smsNotifications ?? false,
        pushNotifications: profile.pushNotifications ?? true
      }));
    }
  }, [profile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'security' && formData.newPassword) {
      if (/\s/.test(formData.newPassword)) {
        showToast("Password cannot contain spaces", "error");
        return;
      }
      if (formData.newPassword.length < 8) {
        showToast("Password must be at least 8 characters", "error");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile(formData);
      showToast("Settings saved successfully");
      if (activeTab === 'security') {
        setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      }
    } catch (error) {
      console.error("Settings update error:", error);
      showToast("Failed to update settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'account', label: 'Account Role', icon: User },
    { id: 'contact', label: 'Contact Info', icon: Mail },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      <Sidebar type={profile?.role === 'landlord' ? 'landlord' : 'tenant'} />
      
      <div className={cn(
        "pt-10 pb-32 px-4 sm:px-6 lg:px-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
        <div className="max-w-6xl mx-auto">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 hover:text-accent transition-all mb-8 w-fit group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>

          <header className="mb-12">
            <h1 className="text-4xl md:text-6xl font-serif italic text-accent mb-4">General Settings</h1>
            <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em] border-l-2 border-accent pl-6">
              Configure your HOE Property Management experience
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Vertical Sidebar Tabs */}
            <aside className="lg:col-span-1 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group text-left",
                    activeTab === tab.id 
                      ? "bg-primary text-secondary shadow-xl shadow-black/10" 
                      : "bg-white/50 text-primary/40 hover:text-accent hover:bg-white"
                  )}
                >
                  <tab.icon className={cn(
                    "w-5 h-5 transition-colors",
                    activeTab === tab.id ? "text-accent" : "text-primary/20 group-hover:text-accent"
                  )} />
                  <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="active-tab" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </button>
              ))}
              
              <div className="pt-8 mt-8 border-t border-primary/5">
                <button 
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group text-left text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5 transition-colors" />
                  <span className="text-xs font-black uppercase tracking-widest">Logout Session</span>
                </button>
              </div>
            </aside>

            {/* Settings Content Area */}
            <main className="lg:col-span-3">
              <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-primary/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-10"
                  >
                    {activeTab === 'account' && (
                      <div className="space-y-6 text-center lg:text-left">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center justify-center lg:justify-start gap-3">
                          <User className="w-3.5 h-3.5" /> Account Role & Permission
                        </label>
                        <p className="text-[11px] text-primary/40 font-medium max-w-md mx-auto lg:mx-0">
                          Select your primary function within the ecosystem. This determines your dashboard views and available features.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                          {['tenant', 'landlord', 'both'].map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, role: role as any }))}
                              className={cn(
                                "group p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-center flex flex-col items-center gap-4 relative overflow-hidden",
                                formData.role === role 
                                  ? "bg-primary border-accent text-accent shadow-2xl shadow-accent/10" 
                                  : "bg-secondary border-transparent text-primary/40 hover:border-primary/10 hover:bg-white"
                              )}
                            >
                              {formData.role === role && (
                                <motion.div 
                                  layoutId="role-indicator"
                                  className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent"
                                />
                              )}
                              <div className={cn(
                                "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500",
                                formData.role === role ? "bg-accent/10 scale-110" : "bg-primary/5 group-hover:bg-primary/10"
                              )}>
                                {role === 'tenant' && <Smartphone className={cn("w-7 h-7", formData.role === role ? "text-accent" : "text-primary/20")} />}
                                {role === 'landlord' && <Home className={cn("w-7 h-7", formData.role === role ? "text-accent" : "text-primary/20")} />}
                                {role === 'both' && <Globe className={cn("w-7 h-7", formData.role === role ? "text-accent" : "text-primary/20")} />}
                              </div>
                              <div className="space-y-1">
                                <span className={cn("text-[11px] font-black uppercase tracking-[0.2em]", formData.role === role ? "text-accent" : "text-primary/60")}>
                                  {role}
                                </span>
                                <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">
                                  {role === 'tenant' ? 'Searching for home' : role === 'landlord' ? 'Managing property' : 'Dual access'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'contact' && (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-3">
                            <Phone className="w-3.5 h-3.5" /> Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                            className="w-full bg-secondary border border-primary/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-accent transition-all font-medium"
                            placeholder="+44 0000 000000"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-3">
                            <MapPin className="w-3.5 h-3.5" /> Physical Address
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full bg-secondary border border-primary/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-accent transition-all font-medium"
                            placeholder="Line 1, Town, Postcode"
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'preferences' && (
                      <div className="space-y-12">
                        <section className="space-y-6">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-3">
                            <MapIcon className="w-3.5 h-3.5" /> Exploration Settings
                          </label>
                          <div className="bg-secondary/50 p-8 rounded-[2.5rem] border border-primary/5">
                            <div className="space-y-2 mb-6">
                              <p className="text-[11px] font-black uppercase tracking-widest">Search Perimeter</p>
                              <p className="text-[9px] text-primary/40 font-bold">Define the default range for localized listings</p>
                            </div>
                            <div className="relative">
                              <select
                                value={formData.searchRadius}
                                onChange={(e) => setFormData(prev => ({ ...prev, searchRadius: e.target.value }))}
                                className="w-full bg-white border border-primary/5 rounded-2xl py-5 px-8 text-sm outline-none focus:border-accent transition-all font-bold appearance-none shadow-sm"
                              >
                                <option value="12">12 Miles Radial</option>
                                <option value="15">15 Miles Radial</option>
                                <option value="25">25 Miles Radial</option>
                              </select>
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary/20">
                                <ChevronRight className="w-5 h-5 rotate-90" />
                              </div>
                            </div>
                          </div>
                        </section>
 
                        <section className="space-y-6">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-3">
                            <Bell className="w-3.5 h-3.5" /> Intelligence Alerts
                          </label>
                          <div className="space-y-4">
                            {[
                              { id: 'emailNotifications', label: 'Email Reports', desc: 'Detailed property matches and market updates', icon: Mail },
                              { id: 'smsNotifications', label: 'SMS Flash Alerts', desc: 'Instant text alerts for viewing confirmations', icon: Phone },
                              { id: 'pushNotifications', label: 'Push Intelligence', desc: 'Real-time dashboard activity notifications', icon: Bell }
                            ].map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-8 bg-secondary/50 rounded-[2rem] border border-primary/5 group hover:bg-white transition-all duration-300">
                                <div className="flex items-center gap-6">
                                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                                    <item.icon className="w-6 h-6 text-accent" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-1">{item.label}</p>
                                    <p className="text-[9px] text-primary/40 font-bold uppercase tracking-widest">{item.desc}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof formData] }))}
                                  className={cn(
                                    "w-14 h-7 rounded-full relative transition-all duration-500",
                                    formData[item.id as keyof typeof formData] ? "bg-accent" : "bg-primary/10"
                                  )}
                                >
                                  <div className={cn(
                                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-md",
                                    formData[item.id as keyof typeof formData] ? "right-1" : "left-1"
                                  )} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}

                    {activeTab === 'security' && (
                      <div className="space-y-8">
                        <div className="space-y-6">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-3">
                            <Lock className="w-3.5 h-3.5" /> Update Password
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">New Password (8+ chars)</p>
                              <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value.replace(/\s/g, '') }))}
                                className="w-full bg-secondary border border-primary/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-accent transition-all"
                              />
                            </div>
                            <div className="space-y-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Confirm New Password</p>
                              <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value.replace(/\s/g, '') }))}
                                className="w-full bg-secondary border border-primary/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-accent transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50/30 rounded-3xl p-8 border border-red-100 flex flex-col gap-6">
                          <div className="flex items-center gap-3 text-red-500">
                            <Trash2 className="w-5 h-5" />
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">Danger Zone</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              type="button"
                              className="py-4 bg-white text-red-500/80 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all font-bold"
                            >
                              Deactivate Account
                            </button>
                            <button
                              type="button"
                              className="py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 font-bold"
                            >
                              Delete Forever
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-12 pt-8 border-t border-primary/5 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-12 py-5 bg-accent text-primary rounded-full font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Save Changes <Save className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>
            </main>
          </div>
        </div>
      </div>
      <BottomNav type={profile?.role === 'landlord' ? 'landlord' : 'tenant'} />

      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
        }}
      />


      {/* Gold Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[5000] flex items-center gap-4 border-2 backdrop-blur-md",
              toast.type === 'success' 
                ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]" 
                : "bg-red-500/10 border-red-500 text-red-500"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <SettingsIcon className="w-5 h-5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
