import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Briefcase, Eye, EyeOff, Phone, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import OTPInput from '../components/OTPInput';
import { auth } from '../lib/firebase';

export default function AuthPage() {
  const isPreviewEnvironment = window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost') || window.location.hostname.includes('webcontainer.io');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [policyViolations, setPolicyViolations] = useState<{ notificationMessage: string }[]>([]);
  
  const [role, setRole] = useState<'tenant' | 'landlord' | 'both' | 'agent' | null>(null);
  const [signupStep, setSignupStep] = useState(0); // 0 for role selection, 1 for details
  const [authStep, setAuthStep] = useState<'credentials' | 'verify-email' | 'verify-phone'>('credentials');
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { loginWithGoogle, user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'resetPassword' && oobCode) {
      setIsResettingPassword(true);
      setIsLogin(true);
      setShowForgotPassword(false);
    }
  }, []);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?mode=resetPassword`,
      });
      if (error) throw error;
      
      setResetSuccess(true);
      showNotification("Reset link sent successfully to your email!", "gold");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      showNotification("Password changed successfully! You can now log in.", "gold");
      setIsResettingPassword(false);
      setIsLogin(true);
      setPassword('');
      setConfirmPassword('');
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !showSuccess && authStep === 'credentials') {
      navigate('/', { replace: true });
    }
  }, [user, navigate, showSuccess, authStep]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    
    if (mode === 'verifyEmail') {
      showNotification("Email verified successfully! Welcome to HOE Property Management", "gold");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showNotification]);

  const handleSignupDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Set first role as both/landlord/tenant conditionally or keep null so they select next
    setRole(null);
    setSignupStep(1); // Proceed to role selection screen
  };

  const executeSignup = async () => {
    if (!role) {
      setError("Please select a profile type.");
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            displayName: name,
            role: role
          },
          emailRedirectTo: `${window.location.origin}/auth?mode=verifyEmail`
        }
      });
      
      if (error) {
         throw error;
      }

      if (data.user) {
        try {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          await setDoc(doc(db, 'users', data.user.id), {
            uid: data.user.id,
            name: name,
            email: email,
            role: role!,
            bio: '',
            contactNumber: '',
            isPublicContact: false,
            showPhoneNumber: false,
            showEmail: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Could not pre-create user Firestore profile. This will be automatically created on first verification login:", dbErr);
        }
      }

      showNotification("Check your email for confirmation!", "gold");
      navigate('/', { state: { showVerifyModal: true } });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (code: string) => {
    setLoading(true);
    setTimeout(() => {
      showNotification("Email verified successfully", "gold");
      setAuthStep('verify-phone');
      setLoading(false);
    }, 1500);
  };

  const handleVerifyPhone = async (code: string) => {
    setLoading(true);
    setTimeout(() => {
      showNotification("Phone verified successfully", "gold");
      setShowSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    }, 1500);
  };

  const resendEmailCode = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?mode=verifyEmail`
        }
      });
      showNotification("Verification email resent", "gold");
    } catch (err) {
      console.error("Failed to resend email:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setPolicyViolations([]);
    
    let signedIn = false;

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error: supabaseErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (supabaseErr) {
        throw supabaseErr;
      }
      signedIn = true;

      if (signedIn) {
        showNotification("Signed in successfully!", "gold");
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error("Sign-in errors across backends:", err);
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed')) {
        navigate('/', { state: { showVerifyModal: true } });
      } else if (msg.includes('invalid') || msg.includes('wrong') || msg.includes('credentials') || msg.includes('auth/wrong-password')) {
        setError("one of the details is incorrect");
      } else if (msg.includes('user not found') || msg.includes('not exist') || msg.includes('auth/user-not-found')) {
        setError("You haven't made an account");
      } else {
        setError("user should retry");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      showNotification("Connecting to Google...", "gold");
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google sign-in login failed:", err);
      setError(err?.message || "Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderVerification = (type: 'email' | 'phone') => (
    <div className="space-y-8 py-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent/20">
          {type === 'email' ? <Mail className="w-8 h-8 text-accent" /> : <Phone className="w-8 h-8 text-accent" />}
        </div>
        <h2 className="text-xl font-serif text-white italic mb-2">Verify your {type}</h2>
        <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
          We've sent a 6-digit code to <br />
          <span className="text-accent font-bold">{type === 'email' ? email : phone}</span>
        </p>
      </div>

      <OTPInput 
        onComplete={type === 'email' ? handleVerifyEmail : handleVerifyPhone} 
        onResend={resendEmailCode}
        resendDisabledTime={60}
      />

      {loading && (
        <div className="flex justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full"
          />
        </div>
      )}
    </div>
  );

  const renderRoleSelection = () => {
    const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twighlightani113@gmail.com', 'twiglightani113@gmail.com', 'nkeface14@gmail.com'];
    const isAgentUser = email && allowedAgentEmails.includes(email.toLowerCase().trim());

    const items = [
      { id: 'landlord', label: 'Landlord Portal', icon: Briefcase, desc: 'Manage and list properties' },
      { id: 'tenant', label: 'Tenant Portal', icon: User, desc: 'Browse and save properties' },
      ...(isAgentUser ? [{ id: 'agent', label: 'Agent Portal', icon: ShieldCheck, desc: 'Manage client portfolios' }] : [])
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-white italic mb-2 tracking-widest uppercase font-bold">PROFILE TYPE</h2>
          <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] mb-8 italic">Choose your identity</p>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setRole(item.id as any)}
              className={cn(
                "p-6 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between group",
                role === item.id 
                  ? "border-accent bg-accent/5 shadow-2xl shadow-accent/5" 
                  : "border-white/5 bg-[#0c0214]/40 hover:border-accent/20"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  role === item.id ? "bg-accent text-[#0c0214]" : "bg-white/5 text-accent/30 group-hover:bg-accent/10"
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className={cn(
                    "font-black uppercase tracking-[0.2em] text-[10px] block mb-0.5",
                    role === item.id ? "text-accent" : "text-white/60"
                  )}>
                    {item.label}
                  </span>
                  <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">{item.desc}</span>
                </div>
              </div>
              {role === item.id && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="w-5 h-5 text-accent shadow-glow" />
                </motion.div>
              )}
            </button>
          ))}
        </div>

        <button
          disabled={!role || loading}
          onClick={executeSignup}
          className="w-full mt-8 py-5 bg-[#0a2f1d] text-[#D4AF37] rounded-xl font-black uppercase tracking-[0.3em] text-[12px] md:text-[13px] hover:bg-accent hover:text-primary transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-3 border border-accent/40 active:scale-95 disabled:opacity-30 disabled:grayscale"
        >
          {loading ? 'Processing...' : 'Create HOE Account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    );
  };

  const renderForgotPassword = () => (
    <div className="space-y-6">
      <div className="text-center mb-10 pb-4 border-b border-white/5">
        <h1 className="text-3xl font-serif italic text-white mb-0 uppercase tracking-widest font-bold">
          Password Recovery
        </h1>
        <p className="text-[10px] text-accent font-extrabold mt-2 uppercase tracking-[0.3em] italic">
          House of Eden
        </p>
      </div>

      <p className="text-white/60 text-[11px] leading-relaxed uppercase tracking-[0.05em] text-center mb-6">
        Enter your registered email address below, and we'll send you a secure link to reset your account password.
      </p>

      {error && (
        <div className="mb-6 bg-red-500/10 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r-xl">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-[10px] font-bold">!</span>
          </div>
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider leading-relaxed">{error}</p>
        </div>
      )}

      {resetSuccess ? (
        <div className="space-y-6 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent/30">
            <span className="text-accent text-[1.4rem]">✉️</span>
          </div>
          <p className="text-accent text-sm font-bold uppercase tracking-wider">
            Reset Link Sent!
          </p>
          <p className="text-white/60 text-[11px] leading-relaxed uppercase tracking-[0.05em]">
            Please check your email inbox for the recovery link to create a new password.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setResetSuccess(false);
              setError('');
            }}
            className="w-full py-4 bg-[#0a2f1d] hover:bg-accent hover:text-[#0c0214] text-[#D4AF37] rounded-xl font-black uppercase tracking-[0.3em] text-[12px] md:text-[13px] border border-accent/40 transition-all shadow-xl hover:scale-[1.02] active:scale-95"
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full bg-[#0c0214]/60 border border-accent/20 rounded-xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-accent transition-all placeholder:text-white/10"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#0a2f1d] text-[#D4AF37] rounded-xl font-black uppercase tracking-[0.3em] text-[12px] md:text-[13px] hover:bg-accent hover:text-primary transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-2 border border-accent/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Reset Password'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setError('');
            }}
            className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-accent transition-colors"
          >
            Back to Entry
          </button>
        </form>
      )}
    </div>
  );

  const renderResetPassword = () => (
    <div className="space-y-6">
      <div className="text-center mb-10 pb-4 border-b border-white/5">
        <h1 className="text-3xl font-serif italic text-white mb-0 uppercase tracking-widest font-bold">
          Create New Password
        </h1>
        <p className="text-[10px] text-accent font-extrabold mt-2 uppercase tracking-[0.3em] italic">
          House of Eden
        </p>
      </div>

      <p className="text-white/60 text-[11px] leading-relaxed uppercase tracking-[0.05em] text-center mb-6">
        Please specify your new secure password. It must be at least 8 characters long.
      </p>

      {error && (
        <div className="mb-6 bg-red-500/10 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r-xl">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-[10px] font-bold">!</span>
          </div>
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              required
              minLength={8}
              className="w-full bg-[#0c0214]/60 border border-accent/20 rounded-xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-accent transition-all placeholder:text-white/10"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/30 hover:text-accent transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat new password"
              required
              minLength={8}
              className="w-full bg-[#0c0214]/60 border border-accent/20 rounded-xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-accent transition-all placeholder:text-white/10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/30 hover:text-accent transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-[#0a2f1d] text-[#D4AF37] rounded-xl font-black uppercase tracking-[0.3em] text-[12px] md:text-[13px] hover:bg-accent hover:text-primary transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-2 border border-accent/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm New Password'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsResettingPassword(false);
            setIsLogin(true);
            setError('');
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
          className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-accent transition-colors"
        >
          Cancel
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#140526] p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative z-10 border border-accent/10"
      >
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-16 left-0 right-0 p-4 bg-accent text-[#0c0214] font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 z-50 border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 transition-transform animate-pulse" />
            <span className="uppercase tracking-[0.1em]">Identity Verified • Welcome to HOE</span>
          </motion.div>
        )}

        {isResettingPassword ? (
          renderResetPassword()
        ) : showForgotPassword ? (
          renderForgotPassword()
        ) : authStep !== 'credentials' ? (
          renderVerification(authStep === 'verify-email' ? 'email' : 'phone')
        ) : (!isLogin && signupStep === 1) ? (
          renderRoleSelection()
        ) : (
          <>
            <div className="text-center mb-10 pb-4 border-b border-white/5">
              <h1 className="text-3xl font-serif italic text-white mb-0 uppercase tracking-widest font-bold">
                {isLogin ? 'Sign In Portal' : 'HOE Account Creation'}
              </h1>
              <p className="text-[10px] text-accent font-extrabold mt-2 uppercase tracking-[0.3em] italic">
                House of Eden
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r-xl">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={isLogin ? (e) => { e.preventDefault(); handleSubmit(e); } : handleSignupDetails} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
                    <input
                      type="text"
                      placeholder="Enter your name"
                      required
                      className="w-full bg-[#0c0214]/60 border border-accent/20 rounded-xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-accent transition-all placeholder:text-white/10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="w-full bg-[#0c0214]/60 border border-accent/20 rounded-xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-accent transition-all placeholder:text-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    required
                    minLength={8}
                    className="w-full bg-[#0c0214]/60 border border-accent/20 rounded-xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-accent transition-all placeholder:text-white/10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/30 hover:text-accent transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isLogin && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError('');
                      }}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 hover:text-accent transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      required
                      minLength={8}
                      className="w-full bg-[#0c0214]/60 border border-accent/20 rounded-xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-accent transition-all placeholder:text-white/10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/30 hover:text-accent transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {policyViolations.length > 0 && (
                <div className="p-4 bg-accent/5 border-l-4 border-accent rounded-r-lg space-y-2">
                  {policyViolations.map((violation, i) => (
                    <div key={i} className="flex items-center gap-2 text-accent text-[9px] font-black uppercase tracking-wider">
                      <span>⚠️</span>
                      <span>{violation.notificationMessage}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#0a2f1d] text-[#D4AF37] rounded-xl font-black uppercase tracking-[0.3em] text-[12px] md:text-[13px] hover:bg-accent hover:text-primary transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-2 border border-accent/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In Portal' : 'Set Profile Type'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest bg-[#140526] px-6 text-white/20">
                Security Gateway
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-white hover:bg-white hover:text-primary transition-all flex items-center justify-center gap-3 group"
            >
              <svg className="w-4 h-4 text-accent group-hover:text-primary transition-colors" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Integration
            </button>
            
            {(signupStep === 1 || authStep !== 'credentials') && (
              <button 
                onClick={() => {
                  setSignupStep(0);
                  setAuthStep('credentials');
                }}
                className="w-full mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-accent transition-colors"
              >
                Return to Entry
              </button>
            )}

            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setSignupStep(0);
                  setAuthStep('credentials');
                }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-accent hover:underline decoration-2 underline-offset-8"
              >
                {isLogin ? "New to HOE? Create Account" : 'Existing Member? Sign In'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );

}
