import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Key, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function DashboardGateway() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading } = useAuth();

  const allowedAgentEmails = ['twighlightani113@gmail.com', 'ann.imaginator@gmail.com', 'nkeface14@gmail.com'];
  const isAgentUser = user?.email && allowedAgentEmails.includes(user.email.toLowerCase());

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
          // Fallback if role is agent but email is not allowed
          navigate('/dashboard/tenant', { replace: true });
        }
      }
      // If role is missing, we stay here to let them select one
    }
  }, [profile, loading, navigate, isAgentUser]);

  const selectRole = async (role: 'tenant' | 'landlord' | 'both' | 'agent') => {
    if (profile) {
      // If the user already has a 'both' or 'agent' role, we don't want to overwrite it 
      if (profile.role !== 'both' && profile.role !== 'agent') {
        await updateProfile({ role });
      }
    }
    
    if (role === 'both') return; 

    navigate(`/dashboard/${role}`);
  };

  if (loading) return null;

  // If role is missing, show specialized selection for onboarding
  if (!profile?.role) {
    return (
      <div className="min-h-screen bg-primary pt-32 pb-20 px-4 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-secondary p-12 rounded-[3rem] shadow-2xl text-center"
        >
          <h1 className="text-4xl font-serif text-accent italic mb-2">Complete Your Profile</h1>
          <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-extrabold mb-10 italic">
            House of Eden
          </p>
          <p className="text-primary/60 text-sm mb-12">How will you be using HOE Property Management? You can change this later in settings.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => selectRole('tenant')}
              className="w-full py-4 bg-primary/5 border border-primary/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:border-accent transition-all"
            >
              Tenant
            </button>
            <button 
              onClick={() => selectRole('landlord')}
              className="w-full py-4 bg-primary/5 border border-primary/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:border-accent transition-all"
            >
              Landlord
            </button>
            {isAgentUser && (
              <button 
                onClick={() => selectRole('agent')}
                className="w-full py-4 bg-primary/5 border border-accent/20 rounded-2xl font-bold uppercase tracking-widest text-xs hover:border-accent transition-all text-accent"
              >
                Agent Portal
              </button>
            )}
            <button 
              onClick={() => selectRole('both')}
              className="w-full py-4 bg-accent text-primary rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-accent-hover transition-all"
            >
              Both (Tenant & Landlord)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If role is 'both' or we want to allow selecting any of the portals
  return (
    <div className="min-h-screen bg-primary pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif text-accent italic mb-4">Select Your Portal</h1>
          <p className="text-secondary/60 uppercase tracking-[0.3em] text-xs">Choose how you'd like to manage your account today</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Tenant Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectRole('tenant')}
            className="group relative overflow-hidden bg-secondary border border-white/10 rounded-3xl p-10 text-left transition-all hover:border-accent/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] shadow-xl"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-accent/20 transition-colors">
                <Key className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-3xl font-serif text-primary mb-4 italic">Tenant Portal</h2>
              <p className="text-primary/60 mb-8 max-w-sm">
                Access your saved properties, manage your search alerts, and track your active enquiries.
              </p>
              <div className="flex items-center text-accent font-bold uppercase tracking-widest text-xs gap-2">
                Enter Portal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
            
            {/* Background Decorative Element */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          {/* Landlord Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectRole('landlord')}
            className="group relative overflow-hidden bg-secondary border border-white/10 rounded-3xl p-10 text-left transition-all hover:border-accent/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] shadow-xl"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-accent/20 transition-colors">
                <Briefcase className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-3xl font-serif text-primary mb-4 italic">Landlord Portal</h2>
              <p className="text-primary/60 mb-8 max-w-sm">
                Manage your listings, view valuation reports, and track leads for your properties.
              </p>
              <div className="flex items-center text-accent font-bold uppercase tracking-widest text-xs gap-2">
                Enter Portal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
            
            {/* Background Decorative Element */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          {/* Agent Card */}
          {isAgentUser && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectRole('agent')}
              className="group relative overflow-hidden bg-secondary border border-white/10 rounded-3xl p-10 text-left transition-all hover:border-accent/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] shadow-xl"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-accent/20 transition-colors">
                  <ShieldCheck className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-3xl font-serif text-accent mb-4 italic">Agent Portal</h2>
                <p className="text-primary/60 mb-8 max-w-sm">
                  Supervise portfolio, onboard landlords, and publish compliant listings on behalf of clients.
                </p>
                <div className="flex items-center text-accent font-bold uppercase tracking-widest text-xs gap-2">
                  Enter Portal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
              
              {/* Background Decorative Element */}
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
