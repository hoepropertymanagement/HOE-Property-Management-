import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DataProtectionInfo() {
  return (
    <div 
      id="hoe-data-protection-info"
      className="relative overflow-hidden bg-[#1a0b2e] text-[#e0e0e0] p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] text-center shadow-2xl border border-[#c299ff]/20 font-sans max-w-4xl mx-auto transition-all duration-300 hover:border-[#c299ff]/40"
    >
      {/* Background radial accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#c299ff]/5 blur-[80px] pointer-events-none" />

      <h3 className="text-xl md:text-2xl font-serif italic text-[#c299ff] mb-4 font-normal tracking-wide">
        Data Protection Information
      </h3>
      
      {/* The Requested Signature Wave Svg */}
      <svg 
        width="120" 
        height="15" 
        xmlns="http://www.w3.org/2000/svg" 
        className="mx-auto mb-6 block"
      >
        <path 
          d="M0 7.5 Q 10 0, 20 7.5 T 40 7.5 T 60 7.5 T 80 7.5 T 100 7.5 T 120 7.5" 
          fill="transparent" 
          stroke="#c299ff" 
          strokeWidth="2"
        />
      </svg>

      <p className="text-sm md:text-base leading-relaxed text-[#e0e0e0]/90 max-w-2xl mx-auto mb-6">
        House of Eden Property Management is the data controller responsible for your personal data. 
        We are registered with the Information Commissioner's Office (ICO) in the United Kingdom.
      </p>

      <ul className="text-sm md:text-base space-y-3 p-0 my-6 inline-block text-left mx-auto">
        <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="text-[#c299ff] font-medium min-w-[180px]">ICO Registration Number:</span>
          <span className="font-mono bg-white/5 px-2.5 py-0.5 rounded text-white text-xs md:text-sm border border-white/5">ZC154194</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="text-[#c299ff] font-medium min-w-[180px]">Registered Address:</span>
          <span>London, United Kingdom</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="text-[#c299ff] font-medium min-w-[180px]">Data Protection Contact:</span>
          <a 
            href="mailto:admin@hoepropertymanagement.co.uk" 
            className="text-[#b366ff] hover:text-[#c299ff] text-sm md:text-base font-medium hover:underline transition-colors"
          >
            admin@hoepropertymanagement.co.uk
          </a>
        </li>
      </ul>
    </div>
  );
}
