import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onResend: () => void;
  isVerified?: boolean;
  resendDisabledTime?: number;
}

export default function OTPInput({ 
  length = 6, 
  onComplete, 
  onResend, 
  isVerified = false,
  resendDisabledTime = 60 
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const [timeLeft, setTimeLeft] = useState(resendDisabledTime);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newOtp.every(val => val !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  const handleResendClick = () => {
    if (timeLeft === 0) {
      onResend();
      setTimeLeft(resendDisabledTime);
    }
  };

  if (isVerified) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 bg-green-500/10 rounded-2xl border border-green-500/20">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-green-500">Identity Verified</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            ref={(el) => (inputRefs.current[index] = el)}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => handleFocus(index)}
            maxLength={1}
            autoComplete="one-time-code"
            className="w-12 h-14 bg-[#0c0214]/60 border border-accent/20 rounded-xl text-center text-white text-xl font-bold outline-none focus:border-accent focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all"
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleResendClick}
          disabled={timeLeft > 0}
          className={cn(
            "text-[10px] font-black uppercase tracking-widest transition-all",
            timeLeft > 0 ? "text-primary/20 cursor-not-allowed" : "text-accent hover:text-accent-hover"
          )}
        >
          {timeLeft > 0 ? `Resend Code in ${timeLeft}s` : "Resend Verification Code"}
        </button>
      </div>
    </div>
  );
}
