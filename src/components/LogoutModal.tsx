import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-primary/5"
          >
            {/* Header with Pattern */}
            <div className="h-32 bg-secondary relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              </div>
              <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center relative z-10">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-primary/40 hover:text-primary transition-all hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 text-center">
              <h3 className="text-2xl font-serif italic text-primary mb-4">Are you sure?</h3>
              <p className="text-[11px] text-primary/40 font-black uppercase tracking-[0.3em] leading-relaxed mb-10 max-w-xs mx-auto">
                You are about to sign out of your HOE account. You will have to relogin to access your dashboard.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98]"
                >
                  Yes, Log Me Out
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-primary/5 text-primary/60 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-primary/10 transition-all active:scale-[0.98]"
                >
                  No, Keep Me Logged In
                </button>
              </div>
            </div>

            {/* Warning Footer */}
            <div className="bg-red-50 p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-[9px] text-red-800 font-bold uppercase tracking-widest leading-relaxed">
                Any unsaved listing progress or draft changes might be lost.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
