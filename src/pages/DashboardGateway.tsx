import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Key, Briefcase, ArrowRight, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function DashboardGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, updateProfile, loading } = useAuth();

  const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twighlightani113@gmail.com', 'twiglightani113@gmail.com', 'nkeface14@gmail.com'];
  const isAgentUser = user?.email && allowedAgentEmails.includes(user.email.toLowerCase());

  const searchParams = new URLSearchParams(location.search);
  const reselect = searchParams.get('reselect') === 'true';

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'tenant') {
        navigate('/dashboard/tenant', { replace: true });
      } else if (profile.role === 'landlord') {
        navigate('/dashboard/landlord', { replace: true });
      } else if (profile.role === 'agent') {
        if (isAgentUser) {
          navigate('/dashboard/agent', { replace: true });
        } else {
          // fallback if role is agent but they are no longer in the allowed emails list
          navigate('/dashboard/landlord', { replace: true });
        }
      }
    }
  }, [profile, loading, navigate, isAgentUser]);

  const selectRole = async (role: 'tenant' | 'landlord' | 'both' | 'agent') => {
    if (profile) {
      if (profile.role !== 'both' && profile.role !== 'agent') {
        await updateProfile({ role });
      }
    }
    
    if (role === 'both') return; 

    navigate(`/dashboard/${role}`);
  };

  if (loading) return null;

  // If role is missing and not an agent, show specialized selection for onboarding
  if (!profile?.role && !isAgentUser) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#0a1a0f] flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-serif text-accent italic mb-4">Select Your Portal</h1>
            <p className="text-secondary/60 uppercase tracking-[0.3em] text-[10px] md:text-xs">Choose how you'd like to manage your account today</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Landlord Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectRole('landlord')}
              className="group relative overflow-hidden bg-[#140526] border border-accent/20 rounded-[2.5rem] p-12 text-left transition-all hover:border-accent shadow-[0_0_40px_rgba(212,175,55,0.05)] hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col items-center text-center h-full"
            >
              <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Briefcase className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-4xl font-serif text-white mb-6 uppercase tracking-widest font-bold">Landlord Portal</h2>
              <p className="text-white/60 mb-10 max-w-sm text-sm leading-relaxed">
                Manage your listings, access valuation reports, and track leads for your properties seamlessly.
              </p>
              <div className="mt-auto px-10 py-5 w-full bg-accent text-[#140526] rounded-xl font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-3 transition-colors group-hover:bg-[#0a2f1d] group-hover:text-accent border border-transparent group-hover:border-accent">
                Enter Portal <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>

            {/* Tenant Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectRole('tenant')}
              className="group relative overflow-hidden bg-[#140526] border border-accent/20 rounded-[2.5rem] p-12 text-left transition-all hover:border-accent shadow-[0_0_40px_rgba(212,175,55,0.05)] hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col items-center text-center h-full"
            >
              <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Key className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-4xl font-serif text-white mb-6 uppercase tracking-widest font-bold">Tenant Portal</h2>
              <p className="text-white/60 mb-10 max-w-sm text-sm leading-relaxed">
                Access your saved properties, manage your search alerts, and track your active enquiries easily.
              </p>
              <div className="mt-auto px-10 py-5 w-full bg-[#0a2f1d] text-accent border border-accent rounded-xl font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-3 transition-all hover:bg-accent hover:text-[#140526]">
                Enter Portal <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // If role is 'both' or user is an agent, we show the path selector
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0a1a0f] flex items-center justify-center p-4">
      <div className="w-full transition-all duration-500 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif text-accent italic mb-4">Select Your Portal</h1>
          <p className="text-secondary/60 uppercase tracking-[0.3em] text-[10px] md:text-xs">Choose how you'd like to manage your account today</p>
        </div>

        <div className="grid gap-8 transition-all duration-500 md:grid-cols-2">
          {/* Landlord Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectRole('landlord')}
            className="group relative overflow-hidden bg-[#140526] border border-accent/20 rounded-[2.5rem] p-12 text-left transition-all hover:border-accent shadow-[0_0_40px_rgba(212,175,55,0.05)] hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col items-center text-center h-full"
          >
            <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Briefcase className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-4xl font-serif text-white mb-6 uppercase tracking-widest font-bold">Landlord Portal</h2>
            <p className="text-white/60 mb-10 max-w-sm text-sm leading-relaxed">
              Manage your listings, access valuation reports, and track leads for your properties seamlessly.
            </p>
            <div className="mt-auto px-10 py-5 w-full bg-accent text-[#140526] rounded-xl font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-3 transition-colors group-hover:bg-[#0a2f1d] group-hover:text-accent border border-transparent group-hover:border-accent">
              Enter Portal <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>

          {/* Tenant Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectRole('tenant')}
            className="group relative overflow-hidden bg-[#140526] border border-accent/20 rounded-[2.5rem] p-12 text-left transition-all hover:border-accent shadow-[0_0_40px_rgba(212,175,55,0.05)] hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col items-center text-center h-full"
          >
            <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Key className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-4xl font-serif text-white mb-6 uppercase tracking-widest font-bold">Tenant Portal</h2>
            <p className="text-white/60 mb-10 max-w-sm text-sm leading-relaxed">
              Access your saved properties, manage your search alerts, and track your active enquiries easily.
            </p>
            <div className="mt-auto px-10 py-5 w-full bg-[#0a2f1d] text-accent border border-accent rounded-xl font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-3 transition-all hover:bg-accent hover:text-[#140526]">
              Enter Portal <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
