import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vlmqmmkenhzkcyqclswy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbXFtbWtlbmh6a2N5cWNsc3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDc3NDEsImV4cCI6MjA5NDc4Mzc0MX0.NT2ddVIg5GhTkg0AO6IqdT52e-LTSPBeqgS02SruQt4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
