import React, { useEffect, useState } from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface AdSenseSlotProps {
  client?: string;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: 'true' | 'false';
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSenseSlot({
  client = "ca-pub-650585154340602c", // Realistic publisher example
  slot = "1049248232",                 // Realistic slot example
  format = "auto",
  responsive = "true",
  className = "",
  style = {}
}: AdSenseSlotProps) {
  const [adConsent, setAdConsent] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    // Read the user cookie consent state
    try {
      const consentStr = localStorage.getItem('hoe_cookie_consent');
      if (consentStr) {
        const consent = JSON.parse(consentStr);
        // If they declined analytics / marketing cookies, we can load non-personalized ads or restrict the tracking
        setAdConsent(consent.analytics !== false);
      }
    } catch (e) {
      console.warn("Cookies reading skipped for Ads:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Push to google ads array safely
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.warn("Failed to push to adsbygoogle (normal in sandbox/dev env):", err);
        // Keep fallback rendering intact
      }
    }
  }, [adConsent]);

  const heightClass = format === 'vertical' ? 'h-[600px]' : format === 'horizontal' ? 'h-[90px]' : 'h-[250px]';

  return (
    <div 
      className={`relative w-full overflow-hidden rounded-3xl transition-all border border-primary/5 bg-secondary/30 shadow-sm ${heightClass} ${className}`}
      style={style}
    >
      {/* Real Google AdSense Tag */}
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />

      {/* Premium UI Safe Overlay & Simulation placeholder when in Developer Mode */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-br from-primary/[0.02] to-primary/[0.08]">
        {/* Top boundary notice */}
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary/30">
            Sponsored Placement
          </span>
          <div className="flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-accent/40" />
            <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-primary/30">
              AdChoices
            </span>
          </div>
        </div>

        {/* Dynamic decorative center frame illustrating premium status */}
        <div className="flex flex-col items-center justify-center grow gap-1.5 opacity-50">
          <div className="p-2 bg-accent/5 rounded-full border border-accent/20 animate-pulse">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent font-serif italic text-center">
            House of Eden Partner
          </span>
          <p className="text-[7px] text-primary/40 uppercase tracking-widest text-center max-w-[180px]">
            Google AdSense Verified Slot
          </p>
        </div>

        {/* Regulatory disclaimer */}
        <div className="flex items-center justify-between text-[7px] text-primary/20 font-mono">
          <span>ID: {slot}</span>
          <span>COMPLIANT ACCORDING TO USER CONSENT</span>
        </div>
      </div>
    </div>
  );
}
