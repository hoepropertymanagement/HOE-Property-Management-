import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface EnquiryFormProps {
  className?: string;
}

export default function EnquiryForm({ className }: EnquiryFormProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [messageValue, setMessageValue] = useState('');

  const isValid = emailValue.length > 5 && messageValue.length > 5 && emailValue.includes('@');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    // Validation check: More than 5 characters for both email and message, and email must contain '@'
    if (!email || email.length <= 5 || !email.includes('@') || !message || message.length <= 5) {
      return;
    }

    // Honeypot check
    const honeypot = formData.get('_honey') as string;
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      return;
    }

    setStatus('sending');

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          _subject: `General Enquiry: ${formData.get('subject')} - ${formData.get('name')}`,
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message')
        })
      });

      if (!response.ok) throw new Error('Internal endpoint failed');

      setStatus('success');
      form.reset();
      setEmailValue('');
      setMessageValue('');
    } catch (error) {
      console.error('Enquiry error:', error);
      setStatus('error');
      setErrorMessage('There was an issue sending your enquiry. Please try again.');
    }
  };

  return (
    <div className={cn("max-w-xl mx-auto", className)} id="enquiry-box">
      <div className="bg-[#1a0b2e] p-8 md:p-10 rounded-[2rem] border border-[#d4af37] shadow-2xl relative overflow-hidden">
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                key="success"
                className="py-12 text-center"
              >
                <div className="w-20 h-20 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-[#d4af37]" />
                </div>
                <h3 className="text-2xl font-serif italic text-[#d4af37] mb-2">Enquiry Sent Successfully</h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">Our team will review your message shortly</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-8 px-6 py-2 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#d4af37]/10 transition-colors"
                >
                  Send another enquiry
                </button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-serif italic text-[#d4af37]">General Enquiry</h3>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Personalised support from HOE Property Management</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="user_name" className="block text-[#d4af37] text-[10px] font-bold uppercase tracking-widest">Name</label>
                    <input 
                      type="text" 
                      id="user_name" 
                      name="name" 
                      required 
                      placeholder="Enter your name"
                      className="w-full px-5 py-3.5 bg-[#2d1b4d] border border-[#d4af37]/20 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all text-sm font-medium placeholder:text-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="user_email" className="block text-[#d4af37] text-[10px] font-bold uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      id="user_email" 
                      name="email" 
                      required 
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-5 py-3.5 bg-[#2d1b4d] border border-[#d4af37]/20 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all text-sm font-medium placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="user_subject" className="block text-[#d4af37] text-[10px] font-bold uppercase tracking-widest">Reason for Enquiry</label>
                  <div className="relative group">
                    <select 
                      id="user_subject" 
                      name="subject"
                      className="w-full px-5 py-3.5 bg-[#2d1b4d] border border-[#d4af37]/20 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all text-sm font-medium appearance-none cursor-pointer pr-12"
                    >
                      <option value="general enquiry">General Enquiry</option>
                      <option value="reports">Reports / Feedback</option>
                      <option value="personal enquiry">Personal Enquiry</option>
                      <option value="business enquiry">Business Enquiry</option>
                      <option value="landlord verification">Landlord Verification</option>
                      <option value="any other">Any other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#d4af37]/40 group-focus-within:text-[#d4af37] transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="user_message" className="block text-[#d4af37] text-[10px] font-bold uppercase tracking-widest">Message</label>
                  <textarea 
                    id="user_message" 
                    name="message" 
                    rows={5} 
                    required 
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                    placeholder="How can we help?"
                    className="w-full px-5 py-3.5 bg-[#2d1b4d] border border-[#d4af37]/20 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all text-sm font-medium placeholder:text-white/10 resize-none"
                  />
                </div>

                {/* Honeypot */}
                <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />

                <button 
                  type="submit" 
                  disabled={status === 'sending' || !isValid}
                  className={cn(
                    "w-full py-5 bg-[#d4af37] text-[#1a0b2e] font-black uppercase tracking-[0.2em] text-[11px] rounded-xl transition-all shadow-xl shadow-[#d4af37]/10 flex items-center justify-center gap-3",
                    (status === 'sending' || !isValid) ? "opacity-50 cursor-not-allowed grayscale-[0.5]" : "hover:bg-[#c5a028] hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Enquiry
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
