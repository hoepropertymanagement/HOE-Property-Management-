import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Search, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import EnquiryForm from '../components/EnquiryForm';

const faqs = [
  { id: 1, q: "Is it free to create a tenant account?", a: "Yes, creating a profile and searching is 100% free." },
  { id: 2, q: "How do I know a landlord is verified?", a: "Look for the 'PRS Registered' badge on their profile, linked to the 2026 UK Landlord Database." },
  { id: 3, q: "Can I message a landlord directly?", a: "Yes, use our internalized chat system to keep your personal data private." },
  { id: 4, q: "What does the 'Privacy Toggle' do?", a: "It allows you to hide your phone number from the public and only communicate via our secure chat." },
  { id: 5, q: "How do I save a property?", a: "Click the heart icon on any listing to save it to your dashboard." },
  { id: 6, q: "Why can’t I see the postcode in suggestions?", a: "We prioritize easy-to-read location names (like 'Hatfield') to keep the search bar clean." },
  { id: 7, q: "Is my 8-character password secure?", a: "Yes, we use encrypted hashing to store all login credentials." },
  { id: 8, q: "How do I update my search radius?", a: "Use the 'Filters +' button to select between 12, 15, or 25-mile increments." },
  { id: 9, q: "What if a listing has no images?", a: "We display a 'No Image' infographic to ensure the site layout stays consistent." },
  { id: 10, q: "How do I submit an enquiry?", a: "Simply fill out the form on the property page or homepage; it is sent silently to the landlord." },
  { id: 11, q: "Can I use Google to sign in?", a: "Yes, we offer an automatic Google Sign-In for instant access." },
  { id: 12, q: "How do I switch between Tenant and Landlord dashboards?", a: "Use the 'Dashboard' gateway to select your role after logging in." },
  { id: 13, q: "Is my data stored in the UK?", a: "Yes, all HOE Property Management data is stored in London-based (europe-west2) data centers for GDPR compliance." },
  { id: 14, q: "What is the circular graphic on the map?", a: "It shows the exact area covered by your selected mileage radius." },
  { id: 15, q: "How do I report a suspicious listing?", a: "Use the 'Report' button on the listing or contact us directly." }
];

export default function HelpFAQ() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="bg-primary pt-32 pb-24 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-serif italic text-accent mb-6">Concierge Help</h1>
          <p className="text-secondary/60 text-xs font-black uppercase tracking-[0.3em] mb-12">Search our 2026 knowledge base</p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
            <input 
              type="text" 
              placeholder="Search for questions (e.g. 'verification', 'dashboard')"
              className="w-full bg-white/5 border border-white/10 rounded-full py-6 pl-16 pr-8 text-secondary outline-none focus:border-accent transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-20">
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div 
              key={faq.id}
              className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 border border-primary/5 overflow-hidden"
            >
              <button 
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full text-left px-8 py-6 flex items-center justify-between group"
              >
                <span className="text-primary font-bold text-sm tracking-tight pr-6">{faq.q}</span>
                <div className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  openId === faq.id ? "bg-accent text-primary" : "bg-secondary text-primary/40 group-hover:bg-accent/10 group-hover:text-accent"
                )}>
                  {openId === faq.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-8 pb-8 text-primary/60 text-sm leading-relaxed">
                      <div className="w-full h-px bg-primary/5 mb-6" />
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-primary/20">
              <p className="text-primary/40 font-bold uppercase text-[10px] tracking-widest">No results found in current database</p>
            </div>
          )}
        </div>

        <div className="mt-24">
          <EnquiryForm />
        </div>

        <div className="mt-16 text-center">
          <div className="bg-primary p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-3xl font-serif italic text-accent mb-4">Didn't find an answer?</h3>
            <p className="text-secondary/60 text-xs font-bold uppercase tracking-[0.2em] mb-8">Our support team is active 24/7</p>
            <a 
              href="mailto:ann.imaginator@gmail.com"
              className="inline-flex items-center gap-3 px-10 py-5 bg-accent text-primary font-bold uppercase tracking-[0.2em] text-[11px] rounded-full hover:scale-105 transition-all shadow-xl shadow-accent/20"
            >
              <Mail className="w-4 h-4" />
              Contact us: ann.imaginator@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
