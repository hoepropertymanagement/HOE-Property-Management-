import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, PoundSterling } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PriceFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  className?: string;
  minimized?: boolean;
}

export default function PriceFilter({ label, value, onChange, options, className, minimized }: PriceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSubmit = () => {
    setIsEditing(false);
    onChange(inputValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  const displayValue = value ? `£${Number(value).toLocaleString()}${Number(value) < 20000 ? ' pcm' : ''}` : label;

  return (
    <div className={cn("relative group", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 bg-black border border-white/10 outline-none text-white text-sm font-bold transition-all hover:bg-black/90 flex items-center justify-between group/btn",
          minimized ? "py-2.5 rounded-xl" : "py-2.5 rounded-xl",
          isOpen && "border-accent bg-accent text-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]"
        )}
      >
        <span className={cn(value ? "text-primary/100" : "text-white/60", isOpen && "text-primary")}>{displayValue}</span>
        <ChevronDown className={cn("w-4 h-4 text-white transition-transform duration-300", isOpen && "rotate-180 text-primary")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 bg-[#F9F7F2] border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[4000] overflow-hidden w-[85vw] max-w-[280px] md:w-64 flex flex-col"
          >
            <div className="p-4 border-b border-border bg-white">
              <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-3">Manual Entry</p>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter custom price..."
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:border-accent transition-all font-bold"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/[^\d]/g, ''))}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="max-h-[250px] md:max-h-[350px] overflow-y-auto custom-scrollbar py-2 px-2 bg-white flex flex-col">
              <button
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={cn(
                  "w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all rounded-xl mb-1",
                  value === '' ? "text-primary bg-accent" : "text-black/40 hover:bg-secondary"
                )}
              >
                No Limit
              </button>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
                {options.map(price => {
                  const isSelected = value === price.toString();
                  return (
                    <button
                      key={price}
                      onClick={() => { onChange(price.toString()); setIsOpen(false); }}
                      className={cn(
                        "w-full px-3 py-2 md:py-3 text-left text-[11px] md:text-xs font-bold transition-all flex items-center justify-between rounded-xl",
                        isSelected 
                          ? "bg-primary text-accent" 
                          : "text-black hover:bg-secondary"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn(isSelected ? "text-accent" : "text-accent")}>£</span>
                        {price.toLocaleString()}
                        {price < 20000 ? ' pcm' : ''}
                      </span>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-3 bg-secondary/50 border-t border-border">
               <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-4 bg-primary text-accent text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
               >
                 Confirm Selection
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
