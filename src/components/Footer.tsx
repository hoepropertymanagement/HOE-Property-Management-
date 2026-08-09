import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, Award } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [logoError, setLogoError] = React.useState(false);

  return (
    <footer className="relative bg-[#0d0518] text-[#e5e7eb] pt-28 pb-16 px-6 md:px-12 overflow-hidden border-t border-[#d4af37]/20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      {/* Background Ambient Lights & Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent pointer-events-none" />
      <div className="absolute -top-40 left-1/4 w-96 h-96 bg-[#8b5cf6]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-20">
          {/* Column 1: Explore */}
          <div className="space-y-6">
            <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.35em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Explore
            </h3>
            <ul className="space-y-3.5">
              {[
                { name: 'Search Properties', path: '/search' },
                { name: 'Lettings / Buy', path: '/search?mode=Rent' },
                { name: 'Valuation', path: '/dashboard/landlord/analytics' },
                { name: 'Student Living', path: '/search?filter=student' },
                { name: 'Services & Fees', path: '/fees' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.path} 
                    className="text-sm text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-2 group hover:translate-x-1"
                  >
                    <span>{link.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#d4af37] opacity-0 group-hover:opacity-100 transition-all -translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Your Account */}
          <div className="space-y-6">
            <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.35em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Account
            </h3>
            <ul className="space-y-3.5">
              {[
                { name: 'Tenant Dashboard', path: '/dashboard/tenant' },
                { name: 'Landlord Dashboard', path: '/dashboard/landlord' },
                { name: 'Profile Settings', path: '/profile' },
                { name: 'Inbox Messages', path: '/dashboard/tenant/messages' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.path} 
                    className="text-sm text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-2 group hover:translate-x-1"
                  >
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-6">
            <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.35em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Support
            </h3>
            <ul className="space-y-3.5">
              {[
                { name: 'About Us', path: '/about' },
                { name: 'Help & FAQs', path: '/help' },
                { name: 'Contact Us', path: '/contact' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.path} 
                    className="text-sm text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-2 group hover:translate-x-1"
                  >
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-6">
            <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.35em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Legal
            </h3>
            <ul className="space-y-3.5">
              {[
                { name: 'Terms & Conditions', path: '/terms' },
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Cookie Policy', path: '/cookies' },
                { name: 'Legal & Compliance', path: '/compliance' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.path} 
                    className="text-sm text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-2 group hover:translate-x-1"
                  >
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Detailed Info Panel */}
        <div className="pt-12 border-t border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 bg-white/[0.02] p-8 md:p-10 rounded-2xl backdrop-blur-md border border-white/5 shadow-2xl">
          
          {/* Brand & Regulatory Information */}
          <div className="space-y-4 max-w-2xl">
            <div>
              <p className="text-2xl text-white font-serif italic tracking-wide">
                House of Eden <span className="text-[#d4af37] text-lg not-italic font-sans font-light">Community Project</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                London, United Kingdom &nbsp;|&nbsp; Contact:{' '}
                <a 
                  href="mailto:admin@hoepropertymanagement.co.uk" 
                  className="text-[#c299ff] hover:text-[#d4af37] transition-colors underline decoration-1 underline-offset-4"
                >
                  admin@hoepropertymanagement.co.uk
                </a>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                ICO Reg: <strong className="text-white font-mono font-medium">ZC154194</strong>
              </span>
              <Link 
                to="/fees" 
                className="inline-flex items-center gap-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] text-xs px-3 py-1 rounded-full transition-all group"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Professional Services & Fees</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            <p className="text-[11px] text-gray-500 pt-2">
              &copy; {currentYear} House of Eden Community Project. All rights reserved.
            </p>
          </div>

          {/* Partner & Accreditation Badges */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-6 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-10 w-full lg:w-auto">
            
            {/* Rent Guarantor */}
            <div className="flex items-center gap-3">
              <div className="text-left lg:text-right">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Official Partner</p>
              </div>
              <a 
                href="https://www.rentguarantor.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/95 hover:bg-white px-3 py-1.5 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
              >
                <img 
                  src="https://www.rentguarantor.com/images/rgv2/rg-logo.svg" 
                  alt="Rent Guarantor" 
                  className="h-7 object-contain"
                />
              </a>
            </div>

            {/* Property Redress Scheme */}
            <div className="flex flex-col items-start lg:items-end gap-1.5">
              <a 
                href="https://www.theprs.co.uk/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-100 transition-opacity"
              >
                {!logoError ? (
                  <img 
                    src="property-redress-logo.jpeg" 
                    alt="Property Redress Scheme Member" 
                    className="h-10 w-auto opacity-90 hover:opacity-100 transition-all rounded"
                    onError={() => setLogoError(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <svg 
                    viewBox="0 0 320 100" 
                    className="h-10 w-auto opacity-90 hover:opacity-100 transition-all" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g>
                      <path d="M 8 85 L 48 15 L 56 15 L 16 85 Z" fill="#71717a" />
                      <rect x="22" y="38" width="13" height="47" rx="1.5" fill="#a855f7" />
                      <rect x="42" y="15" width="13" height="70" rx="1.5" fill="#d946ef" />
                    </g>
                    <text x="68" y="36" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="300">Property</text>
                    <text x="68" y="67" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="28" fontWeight="800">Redress</text>
                    <text x="68" y="88" fill="#d4af37" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" letterSpacing="0.18em">SCHEME</text>
                  </svg>
                )}
              </a>

              <div className="text-[11px] text-gray-400 space-y-0.5 text-left lg:text-right font-mono">
                <p>PRS ID: <strong className="text-[#d4af37]">PRS058192</strong></p>
                <p className="text-[10px] text-gray-500 font-sans">Insured by Simply Business (#CHBS5558206XB)</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Decorative Large Background Typography */}
      <div className="absolute -bottom-10 -left-10 text-[18vw] font-serif italic text-white/[0.015] pointer-events-none select-none leading-none">
        HOE
      </div>
    </footer>
  );
}