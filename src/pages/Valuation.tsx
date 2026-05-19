/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, 
  DollarSign, PieChart, Activity, Globe, Zap,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const leadData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

export default function Valuation() {
  return (
    <div className="bg-secondary min-h-screen">
      <Sidebar type="landlord" />
      
      <div className="md:pl-24 lg:pl-72 pt-10 pb-32 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col gap-4 mb-12">
            <Link 
              to="/dashboard/landlord"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-accent transition-colors mb-2"
            >
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>
            <div>
              <h1 className="text-5xl font-serif italic text-primary">Valuation & Analytics</h1>
              <p className="text-primary/40 mt-2">Deep dive into your property performance and market trends.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { label: 'Portfolio Value', value: '£3.4M', trend: '+4.2%', up: true, icon: Globe },
              { label: 'Active Leads', value: '1,280', trend: '-2.1%', up: false, icon: Zap },
              { label: 'Avg. Yield', value: '5.8%', trend: '+0.5%', up: true, icon: TrendingUp }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-xl shadow-primary/5 group hover:shadow-2xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-secondary rounded-[1.25rem] flex items-center justify-center group-hover:bg-primary group-hover:text-accent transition-all">
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full",
                    stat.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {stat.trend} {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  </div>
                </div>
                <h4 className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-bold mb-1">{stat.label}</h4>
                <p className="text-4xl font-serif italic text-primary tracking-tight">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-10 rounded-[3rem] border border-primary/5 shadow-xl shadow-primary/5">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-serif italic text-primary">Revenue Distribution</h3>
                  <p className="text-[10px] text-primary/30 uppercase font-bold tracking-widest mt-1">Weekly Earnings Report</p>
                </div>
                <button className="p-3 bg-secondary rounded-xl hover:bg-primary hover:text-accent transition-all">
                  <Activity className="w-5 h-5" />
                </button>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c5a059" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#a0a0a0" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a0a0a0" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#c5a059" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-primary p-10 rounded-[3rem] text-secondary">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-serif italic">Lead Generation</h3>
                  <p className="text-[10px] text-secondary/30 uppercase font-bold tracking-widest mt-1">Performance over time</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a2e26', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="value" fill="#c5a059" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav type="landlord" />
    </div>
  );
}
