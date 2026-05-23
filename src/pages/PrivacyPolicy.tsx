import React from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, Database } from 'lucide-react';
import DataProtectionInfo from '../components/DataProtectionInfo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-secondary py-24 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="inline-flex p-4 bg-primary/5 rounded-3xl mb-6">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-5xl font-serif italic text-primary mb-4">Privacy Policy</h1>
          <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.3em]">Guardian of Your Data • 2026</p>
        </header>

        {/* Custom Data Protection Information Component */}
        <div className="mb-12">
          <DataProtectionInfo />
        </div>

        <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-primary/5 space-y-12 text-primary border border-primary/5">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Eye className="w-5 h-5" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">What we collect</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              We collect identity information (Name, Email), profile preferences, and communication logs. We utilize the 2026 biometric-level security for Google Sign-In and encrypted hashing for standard email accounts.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Database className="w-5 h-5" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Data Storage (GDPR 2)</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              All HOE Property Management data is stored in London-based (europe-west2) data centers. This ensures maximum compliance with the 2026 GDPR 2.0 regulations, providing you with the right to be forgotten and total data portability.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Lock className="w-5 h-5" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Privacy Toggles</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              Our unique 'Privacy Shield' allows you to selectively hide your phone number. When toggled off, our system automatically routes potential leads through the internal chat bubble, keeping your personal contact details shielded until you choose to Share.
            </p>
          </section>

          <div className="pt-12 border-t border-primary/5 text-center">
            <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-2">ICO Registered Manager</p>
            <p className="text-[9px] text-primary/30 uppercase tracking-[0.3em] font-black">Ref: HOE-EST-2026-XQ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
