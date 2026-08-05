import React from 'react';
import EnquiryForm from '../components/EnquiryForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-secondary pb-24">
      {/* Hero Section */}
      <div className="bg-primary pt-32 pb-24 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-serif italic text-accent mb-6">Connect with Us</h1>
          <p className="text-secondary/60 text-xs font-black uppercase tracking-[0.3em] mb-12">Bespoke support for our valued clients</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <EnquiryForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
