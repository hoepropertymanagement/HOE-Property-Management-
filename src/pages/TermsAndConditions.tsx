import React from 'react';
import { motion } from 'motion/react';
import { Shield, Scale, Info } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-secondary py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="inline-flex p-4 bg-primary/5 rounded-3xl mb-6">
            <Scale className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-5xl font-serif italic text-primary mb-4">Terms & Conditions</h1>
          <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.3em]">Last Updated: May 2026</p>
        </header>

        <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-primary/5 space-y-12 text-primary border border-primary/5">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Shield className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">User Responsibility</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              Users are strictly responsible for the accuracy of their listings, profile information, and communications. HOE Property Management serves as a facilitating portal and does not verify the structural integrity of properties or the total accuracy of user-generated content beyond identity verification.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Shield className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Verification & Due Diligence</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              While we verify landlord IDs against the 2026 UK Landlord Database (PRS Registered), tenants must perform their own due diligence, including physical viewings and legal document review, before signing a contract or transferring funds.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Shield className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Code of Conduct</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              Zero tolerance for harassment, spamming, or fraudulent activity via the internal chat system. HOE Property Management reserves the right to terminate accounts that violate our community standards or use the platform for purposes other than legitimate property management.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Info className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Third-Party Links</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              We provide resources and links to government sites (e.g., Gov.uk Renting Guide). We are not responsible for content on external sites and do not endorse any third-party services linked via our knowledge base.
            </p>
          </section>

          <div className="pt-12 border-t border-primary/5 text-center italic text-primary/40 font-serif">
            "By using HOE Property Management, you agree to these 2026 governing principles."
          </div>
        </div>
      </div>
    </div>
  );
}
