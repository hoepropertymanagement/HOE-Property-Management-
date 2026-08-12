import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord' | 'agent'>('tenant');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AUTO-REDIRECT LOGIC: Navigates based on selected role / profile
  useEffect(() => {
    if (!loading && user) {
      const activeRole = profile?.role || user?.user_metadata?.role || role || 'tenant';

      if (activeRole === 'landlord') {
        navigate('/dashboard/landlord', { replace: true });
      } else if (activeRole === 'agent') {
        navigate('/dashboard/agent', { replace: true });
      } else {
        navigate('/dashboard/tenant', { replace: true });
      }
    }
  }, [user, profile, loading, navigate, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role }
          }
        });

        if (error) throw error;

        if (data.user) {
          const targetRole = data.user.user_metadata?.role || role;
          navigate(`/dashboard/${targetRole}`, { replace: true });
        }
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          const targetRole = role || data.user.user_metadata?.role || 'tenant';
          navigate(`/dashboard/${targetRole}`, { replace: true });
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err.message);
      setAuthError(err.message || 'Failed to authenticate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')`
      }}
    >
      {/* Light subtle overlay to keep the background image sharp & bright */}
      <div className="absolute inset-0 bg-black/15" />

      {/* High-contrast Auth Card */}
      <div className="relative z-10 max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 text-slate-900 border border-slate-100">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </h1>
          <p className="text-[10px] font-extrabold tracking-widest text-amber-600 uppercase">
            HOUSE OF EDEN PROPERTIES
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-medium">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Account Type
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-xs font-semibold outline-none focus:border-amber-500 focus:bg-white transition-colors"
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
              <option value="agent">Agent</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-xs outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-xs outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-slate-900/20"
          >
            {isSubmitting ? 'PROCESSING...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError(null);
            }}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors"
          >
            {isSignUp ? 'ALREADY HAVE AN ACCOUNT? SIGN IN' : "DON'T HAVE AN ACCOUNT? SIGN UP"}
          </button>
        </div>
      </div>
    </div>
  );
}