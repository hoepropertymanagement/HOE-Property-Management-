import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, ShieldCheck, ArrowRight, Loader2, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface VerificationProps {
  type: 'phone' | 'email';
  value: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function IdentityVerification({ type, value, onSuccess, onCancel }: VerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { profile, updateProfile } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const startVerification = async () => {
    if (type === 'phone' && value.length !== 11) {
      setError('Phone number must be exactly 11 digits long.');
      return;
    }

    if (attempts >= 3) {
      setError('Too many attempts. Please try again in 10 minutes.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (type === 'email') {
        const response = await fetch('/api/verify/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value })
        });
        if (!response.ok) throw new Error('Failed to send verification code');
      } else {
        // Firebase Phone Auth - Placeholder since actual setup requires Recaptcha
        // In a real app, I'd use auth.signInWithPhoneNumber
        // Let's simulate for now or implement if firebase.ts has setup
        console.log("Starting Firebase Phone Auth for", value);
        // Simulation for now to show UI, but we'll try to add actual logic if possible
        const response = await fetch('/api/verify/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: value })
        });
        if (!response.ok) throw new Error('Failed to send SMS code');
      }
      
      setStep('verify');
      setTimer(60);
      setCanResend(false);
      setAttempts(prev => prev + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async () => {
    const code = otp.join('');
    if (code.length < 6) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/verify/check-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          value, 
          code 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid verification code');
      }

      setVerified(true);
      if (type === 'phone') {
        await updateProfile({ isPhoneVerified: true, contactNumber: value });
      }
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-secondary rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10"
      >
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 hover:bg-primary/5 rounded-full transition-colors text-primary/40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-12">
          {verified ? (
            <div className="text-center py-10">
              <div className="w-24 h-24 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                <CheckCircle2 className="w-12 h-12 text-[#d4af37]" />
              </div>
              <h2 className="text-3xl font-serif italic text-primary mb-2">Verified Successfully</h2>
              <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em]">Identity confirmed through {type}</p>
            </div>
          ) : step === 'request' ? (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  {type === 'phone' ? <Phone className="w-8 h-8 text-accent" /> : <Mail className="w-8 h-8 text-accent" />}
                </div>
                <h2 className="text-2xl font-serif italic text-primary mb-2">Verify your {type}</h2>
                <p className="text-primary/50 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  We'll send a 6-digit code to <span className="text-primary">{value}</span> to secure your account.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={startVerification}
                disabled={loading}
                className="w-full py-5 bg-primary text-accent rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-4 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Send Verification Code <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
              
              <p className="text-center text-[9px] text-primary/30 font-bold uppercase tracking-widest">
                By continuing, you agree to receive automated messages for security purposes.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-serif italic text-primary mb-2">Enter Verification Code</h2>
                <p className="text-primary/50 text-[10px] font-bold uppercase tracking-widest">
                  Sent to {value}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-16 md:w-14 md:h-20 bg-primary/5 border border-primary/10 rounded-2xl text-center text-2xl font-serif text-primary outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                  />
                ))}
              </div>

              <div className="space-y-6">
                <button
                  onClick={checkCode}
                  disabled={loading || otp.join('').length < 6}
                  className="w-full py-5 bg-primary text-accent rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Identity'}
                </button>

                <div className="text-center">
                  <button
                    disabled={!canResend || loading}
                    onClick={() => {
                      setStep('request');
                      setOtp(['', '', '', '', '', '']);
                    }}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 mx-auto transition-all",
                      canResend ? "text-accent hover:underline" : "text-primary/20"
                    )}
                  >
                    <RefreshCw className={cn("w-4 h-4", !canResend && "opacity-20")} />
                    {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
