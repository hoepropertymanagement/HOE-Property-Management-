import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X, Shield, Settings, Save, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    const hasConsented = localStorage.getItem('hoe_cookie_consent');
    if (!hasConsented) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('hoe_cookie_consent', JSON.stringify({
      necessary: true,
      functional: true,
      analytics: true,
    }));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('hoe_cookie_consent', JSON.stringify(preferences));
    setIsVisible(false);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  if (!isVisible) return null;

  const categories = [
    {
      id: 'necessary',
      label: 'Necessary',
      shortDesc: 'Essential for login & security',
      longDesc: 'These are required for the site to function. They handle secure 8-character password encryption, keep you logged into your Tenant/Landlord dashboard, and ensure your internal chats are private.',
      alwaysOn: true,
      enabled: true
    },
    {
      id: 'functional',
      label: 'Functional',
      shortDesc: 'Search history & favorite properties',
      longDesc: 'These allow the site to remember your specific preferences. They save your 12, 15, or 25-mile radius settings and keep track of your \'Favorite\' properties so you don\'t have to find them again.',
      alwaysOn: false,
      enabled: preferences.functional
    },
    {
      id: 'analytics',
      label: 'Analytics',
      shortDesc: 'Site usage & feature improvement',
      longDesc: 'These help us understand how people use HOE Property Management. We use this anonymized data to improve search accuracy for locations like Hatfield and Balham and to ensure the site remains lag-free.',
      alwaysOn: false,
      enabled: preferences.analytics
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-[450px] z-[9999]"
      >
        <div className="bg-primary/90 backdrop-blur-xl text-secondary p-8 rounded-[2.5rem] shadow-2xl border border-accent/20 relative overflow-hidden group">
          {/* Subtle patterns */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative">
            {!isCustomizing ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-2xl">
                    <Cookie className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif italic text-accent leading-tight">Cookie Choice</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/40">Privacy-First Architecture</p>
                  </div>
                </div>

                <p className="text-xs text-secondary/60 leading-relaxed italic">
                  We use smart cookies to remember your search radius, favorite properties, and secure your session. No jargon, just better UX.
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleAcceptAll}
                    className="w-full py-4 bg-accent text-primary font-bold uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-accent-hover transition-all shadow-lg shadow-accent/10"
                  >
                    Accept All
                  </button>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        localStorage.setItem('hoe_cookie_consent', JSON.stringify({
                          necessary: true,
                          functional: false,
                          analytics: false,
                        }));
                        setIsVisible(false);
                      }}
                      className="flex-1 py-4 bg-white/5 text-secondary font-bold uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-white/10 transition-all border border-white/10"
                    >
                      Reject All
                    </button>
                    <button 
                      onClick={() => setIsCustomizing(true)}
                      className="flex-1 py-4 bg-white/5 text-secondary font-bold uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-accent" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Privacy Settings</h3>
                  </div>
                  <button onClick={() => setIsCustomizing(false)} className="text-secondary/40 hover:text-accent transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                      <div className="p-4 flex items-center justify-between">
                        <button 
                          onClick={() => toggleCategory(cat.id)}
                          className="flex items-center gap-3 text-left group/btn"
                        >
                          <ChevronDown className={cn(
                            "w-4 h-4 text-accent/50 transition-transform duration-300",
                            expandedCategory === cat.id ? "rotate-180" : ""
                          )} />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold uppercase tracking-wider">{cat.label}</span>
                            <span className="text-[9px] text-secondary/40">{cat.shortDesc}</span>
                          </div>
                        </button>

                        <button 
                          disabled={cat.alwaysOn}
                          onClick={() => setPreferences(prev => ({ 
                            ...prev, 
                            [cat.id]: !prev[cat.id as keyof typeof preferences] 
                          }))}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative",
                            cat.enabled ? "bg-accent" : "bg-white/10",
                            cat.alwaysOn && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            cat.enabled ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {expandedCategory === cat.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-11 pb-4 text-[10px] text-secondary/50 leading-relaxed italic border-t border-white/5 pt-3">
                              {cat.longDesc}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleSavePreferences}
                  className="w-full py-4 bg-accent text-primary font-bold uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-accent-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                  <Save className="w-4 h-4" />
                  Save My Choices
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
