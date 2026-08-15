import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vlmqmmkenhzkcyqclswy.supabase.co';
const supabaseAnonKey = 'VITE_SUPABASE_ANON_KEY=sb_publishable_vxjoq0uQTReXnhINLXexYg_cVJ_1pjG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});