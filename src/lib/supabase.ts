import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vlmqmmkenhzkcyqclswy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ACTUAL_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // Abort queries after 8 seconds so the app never hangs indefinitely
    fetch: (url, options) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(id));
    },
  },
});