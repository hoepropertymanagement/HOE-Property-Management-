import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord' | 'agent'>('tenant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authContext = useAuth() as any;
  const navigate = useNavigate();

  const handleSuccessRedirect = () => {
    // Redirect based on selected role
    if (role === 'landlord') {
      navigate('/landlord-dashboard', { replace: true });
    } else if (role === 'agent') {
      navigate('/agent-dashboard', { replace: true });
    } else {
      navigate('/search', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (authContext?.login) {
          await authContext.login(email, password, role);
        }
      } else {
        if (authContext?.signup) {
          await authContext.signup(email, password, role);
        }
      }
      handleSuccessRedirect();
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b132b] overflow-hidden">
      {/* Top Header - Simple Logo Only (No extra search/dashboard buttons) */}
      <header className="w-full bg-[#0b132b] border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-serif font-bold text-white tracking-wide">
            HOE <span className="text-emerald-400 font-light">Property Management</span>
          </span>
        </div>
      </header>

      {/* Main Split Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        
        {/* LEFT SIDE: Crystal Clear Background Image */}
        <div 
          className="relative hidden lg:flex lg:w-1/2 bg-cover bg-center items-center justify-center p-12"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop')` 
          }}
        >
          {/* Subtle gradient at the bottom for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20"></div>

          {/* Text Content */}
          <div className="relative z-10 max-w-lg text-white space-y-4 mt-auto mb-12">
            <span className="inline-block text-xs uppercase tracking-[0.25em] font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
              House of Eden
            </span>
            <h1 className="text-4xl xl:text-5xl font-serif font-bold leading-tight drop-shadow-md">
              Welcome to the Future of Property Management.
            </h1>
            <p className="text-slate-200 text-sm leading-relaxed drop-shadow">
              Seamlessly manage your listings, tenant requests, and luxury stays all in one unified platform.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Clean Sign-In Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#0b132b] text-white overflow-y-auto">
          <div className="w-full max-w-md space-y-6 bg-slate-900/90 p-8 rounded-2xl border border-slate-800 shadow-2xl">
            
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-serif font-bold tracking-wide">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {isLogin ? 'Enter your details below to access your account' : 'Fill in the details to get started'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs text-center">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* ROLE SELECTION: Available on both Sign In & Sign Up */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['tenant', 'landlord', 'agent'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 text-xs font-medium rounded-lg capitalize border transition-all ${
                        role === r
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="erioluwaaskintola9@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-emerald-950/50 transition-all focus:outline-none disabled:opacity-50 mt-2"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}