import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord' | 'agent'>('tenant');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle incoming session after OAuth redirect
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const userRole = session.user.user_metadata?.role || profile?.role || role || 'tenant';
        navigate(`/dashboard/${userRole}`, { replace: true });
      }
    };

    handleAuthRedirect();

    // Listen for auth change (catches hash token parsing automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const userRole = session.user.user_metadata?.role || profile?.role || role || 'tenant';
        navigate(`/dashboard/${userRole}`, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, profile, role]);

  // Clean Google Auth handler targeting exact current host (localhost or prod)
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Dynamically resolves to http://localhost:3000 or https://hoepropertymanagement.co.uk
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth error:", err.message);
      setAuthError(err.message || 'Failed to initialize Google login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role } },
        });

        if (error) throw error;
        if (data.user) {
          const targetRole = data.user.user_metadata?.role || role;
          navigate(`/dashboard/${targetRole}`, { replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
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
      <div className="absolute inset-0 bg-black/15" />

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

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[10px] font-extrabold uppercase text-slate-400 absolute">
            OR
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3 flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          CONTINUE WITH GOOGLE
        </button>

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