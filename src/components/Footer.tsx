import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [logoError, setLogoError] = React.useState(false);

  return (
    <footer className="bg-primary text-secondary pt-24 pb-12 px-8 overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
          {/* Column 1: Explore */}
          <div className="space-y-6">
            <h3 className="text-accent text-xs font-black uppercase tracking-[0.3em] mb-8">Explore</h3>
            <ul className="space-y-4">
              <li><Link to="/search" className="text-sm text-secondary/60 hover:text-accent transition-colors flex items-center gap-2 group">Search Properties <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link to="/search?mode=Rent" className="text-sm text-secondary/60 hover:text-accent transition-colors flex items-center gap-2 group">Lettings/Buy <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link to="/dashboard/landlord/analytics" className="text-sm text-secondary/60 hover:text-accent transition-colors flex items-center gap-2 group">Valuation <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link to="/search?filter=student" className="text-sm text-secondary/60 hover:text-accent transition-colors flex items-center gap-2 group">Student Living <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
            </ul>
          </div>

          {/* Column 2: Your Account */}
          <div className="space-y-6">
            <h3 className="text-accent text-xs font-black uppercase tracking-[0.3em] mb-8">Your Account</h3>
            <ul className="space-y-4">
              <li><Link to="/dashboard/tenant" className="text-sm text-secondary/60 hover:text-accent transition-colors">Tenant Dashboard</Link></li>
              <li><Link to="/dashboard/landlord" className="text-sm text-secondary/60 hover:text-accent transition-colors">Landlord Dashboard</Link></li>
              <li><Link to="/profile" className="text-sm text-secondary/60 hover:text-accent transition-colors">Profile Settings</Link></li>
              <li><Link to="/dashboard/tenant/messages" className="text-sm text-secondary/60 hover:text-accent transition-colors">Inbox</Link></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-6">
            <h3 className="text-accent text-xs font-black uppercase tracking-[0.3em] mb-8">Support</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-secondary/60 hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/help" className="text-sm text-secondary/60 hover:text-accent transition-colors">Help / FAQs</Link></li>
              <li><Link to="/contact" className="text-sm text-secondary/60 hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-6">
            <h3 className="text-accent text-xs font-black uppercase tracking-[0.3em] mb-8">Legal</h3>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-sm text-secondary/60 hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-sm text-secondary/60 hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-sm text-secondary/60 hover:text-accent transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-secondary/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-serif italic text-accent mb-2">HOE Property Management</h2>
            <p className="text-[10px] text-secondary/30 uppercase tracking-[0.2em] font-extrabold mb-8 italic">
              House of Eden
            </p>
            <p className="text-[10px] text-secondary/30 uppercase tracking-[0.2em] font-bold">
              © {currentYear} House of Eden Property Management. Registered in England & Wales. ICO Data Compliant.
            </p>
          </div>

          {/* PRS Compliance Section */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex flex-col items-center gap-2">
              <a 
                href="https://www.theprs.co.uk/" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                {!logoError ? (
                  <img 
                    src="property-redress-logo.jpeg" 
                    alt="Property Redress Scheme Member" 
                    style={{ height: '64px', width: 'auto', cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.3s ease' }}
                    onError={() => setLogoError(true)}
                    referrerPolicy="no-referrer"
                    className="hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <svg 
                    viewBox="0 0 320 100" 
                    style={{ height: '64px', width: 'auto', cursor: 'pointer', opacity: 0.9 }} 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="hover:opacity-100 transition-opacity"
                  >
                    <g>
                      {/* Left: Slate grey angle, parallel to the purple pillars */}
                      <path d="M 8 85 L 48 15 L 56 15 L 16 85 Z" fill="#71717a" />
                      {/* Purple pillar 1 */}
                      <rect x="22" y="38" width="13" height="47" rx="1.5" fill="#a855f7" />
                      {/* Magenta/fuchsia pillar 2 */}
                      <rect x="42" y="15" width="13" height="70" rx="1.5" fill="#d946ef" />
                    </g>
                    {/* Brand Texts matching the uploaded logo */}
                    <text x="68" y="36" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="300" letterSpacing="0.02em">Property</text>
                    <text x="68" y="67" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="28" fontWeight="800" letterSpacing="0.01em">Redress</text>
                    <text x="68" y="88" fill="#d4af37" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" letterSpacing="0.18em">SCHEME</text>
                  </svg>
                )}
              </a>
              <div className="text-[8px] font-black uppercase tracking-[0.15em] text-[#d4af37] bg-white/[0.03] px-2 py-1 rounded border border-white/5 text-center select-none">
                Member No: PRS058192
              </div>
            </div>
            <p className="text-[9px] text-secondary/30 uppercase tracking-[0.3em] font-bold">
              Independent Redress Provided
            </p>
          </div>
        </div>
      </div>

      {/* Background Text Accent */}
      <div className="absolute -bottom-16 -left-16 text-[20vw] font-serif italic text-white/[0.02] pointer-events-none select-none">
        HOE
      </div>
    </footer>
  );
}
