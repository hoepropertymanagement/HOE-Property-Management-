import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
            <a 
              href="https://www.propertyredress.co.uk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group transition-all duration-500 hover:scale-[1.02]"
            >
              <div className="bg-white p-3 rounded-2xl shadow-2xl border border-secondary/10 flex flex-col items-center gap-2 max-w-[160px]">
                <img 
                  src="https://www.propertyredress.co.uk/media/1001/prs-logo-final.png" 
                  alt="Property Redress Scheme Member" 
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#0c0214] border-t border-primary/5 pt-2 w-full text-center">
                  Member No: PRS058192
                </div>
              </div>
            </a>
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
