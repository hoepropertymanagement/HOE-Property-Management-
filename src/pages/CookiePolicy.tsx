import React from 'react';
import { motion } from 'motion/react';
import { Cookie, Info } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-secondary py-24 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="inline-flex p-4 bg-primary/5 rounded-3xl mb-6">
            <Cookie className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-5xl font-serif italic text-primary mb-4">Cookie Policy</h1>
          <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.3em]">Smart tracking • User choice</p>
        </header>

        <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-primary/5 space-y-12 text-primary border border-primary/5">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Info className="w-5 h-5" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Our Approach</h2>
            </div>
            <p className="text-sm leading-relaxed text-primary/70">
              We use Cookies to improve your search experience. Unlike standard portals, we prioritize "Functional Cookies" that remember your specific filter sets (Radius, Shared vs Private) so you don't have to re-configure them every time.
            </p>
          </section>

          <div className="space-y-8">
            <div className="p-6 bg-secondary/50 rounded-3xl border border-primary/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">Necessary</h3>
              <p className="text-xs text-primary/50 leading-relaxed">Required for logging in, account security, and ensuring the 'Save Changes' button functions correctly on your profile.</p>
            </div>
            
            <div className="p-6 bg-secondary/50 rounded-3xl border border-primary/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">Functional</h3>
              <p className="text-xs text-primary/50 leading-relaxed">Remembers your search history, mileage radius settings, and those properties you've 'hearted' for later viewing.</p>
            </div>

            <div className="p-6 bg-secondary/50 rounded-3xl border border-primary/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">Analytics</h3>
              <p className="text-xs text-primary/50 leading-relaxed">Helps our creative team see which features (like the map radius tool) are being used most frequently so we can optimize performance.</p>
            </div>
          </div>

          <div className="pt-12 border-t border-primary/5 text-center italic text-primary/40 font-serif">
            "Your preferences are stored locally and encrypted for your safety."
          </div>
        </div>
      </div>
    </div>
  );
}
