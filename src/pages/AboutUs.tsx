import React from 'react';
import { motion } from 'motion/react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-primary py-24 px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto relative">
        {/* Background Accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <header className="mb-16">
            <h1 className="text-6xl md:text-7xl font-serif italic text-accent mb-6 leading-tight">
              Radically <br /> Transparent.
            </h1>
            <div className="w-24 h-1 bg-accent/20 mb-8" />
            <p className="text-secondary/60 text-lg md:text-xl font-medium tracking-wide uppercase">
              Simplified Property Search for You.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-secondary/80 leading-relaxed">
            <div className="space-y-6">
              <h2 className="text-2xl font-serif italic text-accent">Our Core Message</h2>
              <p>
                HOE Property Management is a family-built business, born from a mother and her daughter who wished for easier, more accessible, and transparent rental sites. We believe your search for a home should be clear, honest, and effortless.
              </p>
              <p>
                Our platform is built to provide you with absolute clarity, removing the noise and complexity of the traditional rental market to put the control back in your hands.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-serif italic text-accent">What We Do</h2>
              <p>
                We give you direct access to verified listings and secure communication tools, ensuring your next move is fast, private, and stress-free. Our mission is to make finding a home as simple as possible, with no hidden hurdles.
              </p>
              <p>
                Whether you are renting for the first time or the tenth, HOE Property Management is designed to provide the tools you need for a smooth and transparent journey from search to sign-off.
              </p>
            </div>
          </div>

          <div className="mt-24 p-12 bg-white/5 border border-white/10 rounded-[3rem] text-center">
            <p className="text-secondary/40 text-xs font-bold uppercase tracking-[0.3em] mb-4">Established 2026</p>
            <p className="text-3xl font-serif italic text-accent">"Born in London, Built for You."</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
