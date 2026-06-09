import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/45 backdrop-blur-[4px]"
          />

          {/* Modal - Compact Rectangle Bar style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-primary/5 p-6 md:p-8 z-10 flex flex-col gap-5 overflow-hidden"
          >
            {/* Minimal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif italic text-primary font-bold">Sign Out</h3>
                  <p className="text-[9px] text-[#D4AF37] font-extrabold uppercase tracking-widest leading-none mt-1">
                    House of Eden
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary/40 hover:text-primary transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Warning/Help Text */}
            <p className="text-[11px] text-primary/50 font-medium leading-relaxed">
              Are you sure you want to log out? Any unsaved changes may be lost, and you'll need to sign back in to access your portal.
            </p>

            {/* Side-by-Side Horizontal Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={onClose}
                className="py-3 px-4 bg-secondary text-primary/70 hover:bg-primary/5 hover:text-primary rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer text-center shadow-md shadow-red-500/10 active:scale-[0.98]"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
