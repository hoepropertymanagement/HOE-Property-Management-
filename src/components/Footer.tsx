import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [logoError, setLogoError] = React.useState(false);

  return (
    <footer className="bg-[#1a0b2e] text-[#e0e0e0] pt-24 pb-12 px-8 overflow-hidden relative border-t border-[#c299ff]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
          {/* Column 1: Explore */}
          <div className="space-y-6">
            <h3 className="text-[#c299ff] text-xs font-black uppercase tracking-[0.3em] mb-8">Explore</h3>
            <ul className="space-y-4">
              <li><Link to="/search" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors flex items-center gap-2 group">Search Properties <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link to="/search?mode=Rent" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors flex items-center gap-2 group">Lettings/Buy <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link to="/dashboard/landlord/analytics" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors flex items-center gap-2 group">Valuation <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link to="/search?filter=student" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors flex items-center gap-2 group">Student Living <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
            </ul>
          </div>

          {/* Column 2: Your Account */}
          <div className="space-y-6">
            <h3 className="text-[#c299ff] text-xs font-black uppercase tracking-[0.3em] mb-8">Your Account</h3>
            <ul className="space-y-4">
              <li><Link to="/dashboard/tenant" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Tenant Dashboard</Link></li>
              <li><Link to="/dashboard/landlord" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Landlord Dashboard</Link></li>
              <li><Link to="/profile" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Profile Settings</Link></li>
              <li><Link to="/dashboard/tenant/messages" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Inbox</Link></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-6">
            <h3 className="text-[#c299ff] text-xs font-black uppercase tracking-[0.3em] mb-8">Support</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">About Us</Link></li>
              <li><Link to="/help" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Help / FAQs</Link></li>
              <li><Link to="/contact" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-6">
            <h3 className="text-[#c299ff] text-xs font-black uppercase tracking-[0.3em] mb-8">Legal</h3>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Cookie Policy</Link></li>
              <li><Link to="/compliance" className="text-sm text-secondary/60 hover:text-[#c299ff] transition-colors">Legal & Compliance</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-[#c299ff]/30 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left flex-grow max-w-2xl space-y-3">
            <p className="text-lg text-[#c299ff] font-serif italic">
              House of Eden Community Project
            </p>
            
            <p className="text-sm text-[#a3a3a3]">
              London, United Kingdom | Contact:{' '}
              <a 
                href="mailto:admin@hoepropertymanagement.co.uk" 
                className="text-[#b366ff] hover:text-[#c299ff] transition-all hover:underline"
              >
                admin@hoepropertymanagement.co.uk
              </a>
            </p>
            
            <div className="w-[50px] h-[2px] bg-[#c299ff] opacity-50 my-4 mx-auto md:mx-0"></div>
            
            <p className="text-sm text-[#a3a3a3]">
              Registered with the Information Commissioner's Office (ICO). Reference Number: <span className="font-mono bg-white/5 border border-white/15 px-2 py-0.5 rounded text-white text-xs">ZC154194</span>
            </p>
            
            <div className="my-2">
              <Link to="/fees" className="text-sm font-bold text-[#c299ff] hover:text-[#d4af37] transition-colors inline-flex items-center">
                Transparent Fee Schedule (Landlords & Tenants)
              </Link>
            </div>
            
            <p className="text-xs text-[#666666]">
              &copy; {currentYear} House of Eden Community Project. All rights reserved.
            </p>
          </div>

          {/* PRS Compliance Section */}
          <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right shrink-0">
            <div className="flex flex-col items-center md:items-end gap-2">
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
                    style={{ height: '40px', width: 'auto', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.3s ease' }}
                    onError={() => setLogoError(true)}
                    referrerPolicy="no-referrer"
                    className="hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <svg 
                    viewBox="0 0 320 100" 
                    style={{ height: '40px', width: 'auto', cursor: 'pointer', opacity: 0.8 }} 
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
              <div className="text-[11px] text-[#e0e0e0]/60 leading-relaxed font-sans mt-2 space-y-1">
                <p>PRS Member ID: <strong className="text-accent">PRS058192</strong></p>
                <p>Fully Insured by: <strong className="text-[#e0e0e0]/90">Simply Business</strong> | Policy: <strong className="text-[#e0e0e0]/70">CHBS5558206XB</strong></p>
              </div>
            </div>
            <p className="text-[9px] text-[#e0e0e0]/35 uppercase tracking-[0.3em] font-bold mt-1">
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
