import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const WigglyDivider = () => (
  <div className="w-full max-w-md mx-auto my-12 flex justify-center items-center overflow-hidden opacity-30">
    <svg width="200" height="20" viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#c299ff]">
      <path d="M0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10 T 125 10 T 150 10 T 175 10 T 200 10" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  </div>
);

interface AccordionSectionProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection = ({ id, title, isOpen, onToggle, children }: AccordionSectionProps) => (
  <div className="mb-6 rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:border-[#c299ff]/30">
    <button
      onClick={onToggle}
      className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors ${
        isOpen ? 'bg-[#c299ff]/10 text-[#c299ff]' : 'text-white hover:bg-white/5'
      }`}
    >
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <ChevronDown
        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'transform rotate-180 text-[#c299ff]' : 'text-gray-400'}`}
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="p-6 md:p-8 text-[#e0e0e0] space-y-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function Fees() {
  const [openSection, setOpenSection] = useState<string | null>('tenant-find');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="bg-[#1a0b2e] flex flex-col font-sans min-h-screen pt-24">
      <main className="flex-grow pt-12 pb-24 px-6 relative z-10 w-full max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#c299ff] tracking-tight mb-8 drop-shadow-[0_0_15px_rgba(194,153,255,0.4)]">
            Fee Schedule
          </h1>
          
          <div className="bg-[#c299ff]/10 border border-[#c299ff]/30 rounded-xl p-4 md:p-6 flex items-start gap-4 max-w-2xl mx-auto shadow-[0_0_20px_rgba(194,153,255,0.15)] text-left">
            <Info className="w-6 h-6 text-[#c299ff] flex-shrink-0 mt-1" />
            <div>
              <p className="text-[#e0e0e0] font-medium leading-relaxed">
                <strong className="text-[#c299ff]">We are not currently VAT registered.</strong> There is no VAT on any of our fees. What you see is what you pay.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <AccordionSection
            id="tenant-find"
            title="Tenant Find Services"
            isOpen={openSection === 'tenant-find'}
            onToggle={() => toggleSection('tenant-find')}
          >
            <div className="space-y-8">
              <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h4 className="text-xl font-bold text-white">Essential Tier</h4>
                  <span className="inline-block bg-[#c299ff]/20 text-[#c299ff] px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">1 Week's Rent (Min £400)</span>
                </div>
                <p className="text-[#a3a3a3] mb-4">Advertising, referencing, right to rent, tenancy agreement. First viewing free, £25–£50 after.</p>
              </div>

              <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h4 className="text-xl font-bold text-[#c299ff] drop-shadow-[0_0_8px_rgba(194,153,255,0.4)]">Standard Tier</h4>
                  <span className="inline-block bg-[#c299ff]/20 text-[#c299ff] px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">2 Weeks' Rent (Min £600)</span>
                </div>
                <p className="text-[#a3a3a3] mb-4">Everything in Essential + Right to Rent check, detailed referencing report, all viewings included.</p>
              </div>

              <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h4 className="text-xl font-bold text-white">Premium Tier</h4>
                  <span className="inline-block bg-[#c299ff]/20 text-[#c299ff] px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">1 Month's Rent (Min £900)</span>
                </div>
                <p className="text-[#a3a3a3] mb-4">Everything in Standard + photography, full compliance check, dashboard onboarding, move-in support.</p>
              </div>
            </div>
          </AccordionSection>

          <WigglyDivider />

          <AccordionSection
            id="property-management"
            title="Property Management Packages"
            isOpen={openSection === 'property-management'}
            onToggle={() => toggleSection('property-management')}
          >
            <div className="space-y-8">
              <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h4 className="text-xl font-bold text-white">Rent Collection Only</h4>
                  <div className="flex flex-col md:items-end gap-1">
                    <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">6% of Monthly Rent</span>
                    <span className="text-xs text-white/50">Starting Fee: 2 weeks' rent</span>
                  </div>
                </div>
                <p className="text-[#a3a3a3]">Monthly rent collected, transferred to landlord within 7 working days, monthly statement, arrears follow-up, annual tax statement. Maintenance and compliance remain with the landlord.</p>
              </div>

              <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h4 className="text-xl font-bold text-white">Essential Management</h4>
                  <div className="flex flex-col md:items-end gap-1">
                    <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">10% of Monthly Rent</span>
                    <span className="text-xs text-white/50">Starting Fee: 1 month's rent</span>
                  </div>
                </div>
                <p className="text-[#a3a3a3]">Includes Rent Collection + basic maintenance logging, landlord notification, and tenant communication first point of contact.</p>
              </div>

              <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h4 className="text-xl font-bold text-[#c299ff] drop-shadow-[0_0_8px_rgba(194,153,255,0.4)]">Premium Management</h4>
                  <div className="flex flex-col md:items-end gap-1">
                    <span className="inline-block bg-[#c299ff]/20 text-[#c299ff] px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">12% of Monthly Rent</span>
                    <span className="text-xs text-white/50">Starting Fee: 1 month's rent</span>
                  </div>
                </div>
                <p className="text-[#a3a3a3]">Everything in Essential + maintenance coordination, 6-monthly inspections with report, emergency repairs under £150 actioned same day, compliance management.</p>
              </div>

              <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h4 className="text-xl font-bold text-white">Elite Management</h4>
                  <div className="flex flex-col md:items-end gap-1">
                    <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">15% of Monthly Rent</span>
                    <span className="text-xs text-white/50">Starting Fee: 1 month's rent</span>
                  </div>
                </div>
                <p className="text-[#a3a3a3]">Everything in Premium + quarterly inspections, emergency contractor guaranteed within 2 hours, three quotes for jobs over £150, Section 8 notice preparation, deposit dispute support, and quarterly portfolio review.</p>
              </div>
            </div>
          </AccordionSection>

          <WigglyDivider />

          <AccordionSection
            id="additional-charges"
            title="Additional Landlord Charges"
            isOpen={openSection === 'additional-charges'}
            onToggle={() => toggleSection('additional-charges')}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <span className="text-[#e0e0e0]">Tenancy renewal (all packages)</span>
                <span className="font-bold text-[#c299ff]">£100</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <span className="text-[#e0e0e0]">Standalone accompanied viewing</span>
                <span className="font-bold text-[#c299ff]">£25–£50 per viewing</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <span className="text-[#e0e0e0]">Emergency repairs under £150</span>
                <span className="font-bold text-[#c299ff]">Action first, notify landlord</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <span className="text-[#e0e0e0]">Repairs over £150</span>
                <span className="font-bold text-[#c299ff]">Landlord approval required</span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-[#e0e0e0]">Notice period to leave HOE</span>
                <span className="font-bold text-[#c299ff]">30 days written notice</span>
              </div>
            </div>
          </AccordionSection>

          <WigglyDivider />

          <AccordionSection
            id="tenant-information"
            title="Tenant Information & Fees"
            isOpen={openSection === 'tenant-information'}
            onToggle={() => toggleSection('tenant-information')}
          >
            <div className="space-y-6">
              <p className="text-[#a3a3a3] leading-relaxed">
                In compliance with the Tenant Fees Act 2019, tenants are not charged administrative, referencing, or inventory fees. 
              </p>
              
              <ul className="space-y-4 list-disc pl-5 text-[#e0e0e0]">
                <li><strong className="text-white">Holding Deposit:</strong> Capped at 1 week's rent.</li>
                <li><strong className="text-white">Security Deposit:</strong> Capped at 5 weeks' rent for annual rent under £50,000, or 6 weeks' rent for annual rent over £50,000.</li>
                <li><strong className="text-white">Late Rent Penalty:</strong> Interest at 3% above the Bank of England Base Rate from Rent Due Date until paid in order to pursue non-payment of rent.</li>
                <li><strong className="text-white">Lost Key/Security Device:</strong> Tenants are liable to the actual cost of replacing any lost key(s) or other security device(s).</li>
                <li><strong className="text-white">Variation of Contract:</strong> Capped at £50 per agreed variation (or higher reasonable costs incurred).</li>
              </ul>
            </div>
          </AccordionSection>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link 
            to="/#valuation"
            className="inline-block bg-[#c299ff] hover:bg-[#b366ff] text-[#1a0b2e] font-black text-lg md:text-xl uppercase tracking-widest px-8 md:px-12 py-5 rounded-full shadow-[0_0_20px_rgba(194,153,255,0.4)] hover:shadow-[0_0_30px_rgba(194,153,255,0.6)] transition-all transform hover:scale-105"
          >
            Request Property Consultation
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
