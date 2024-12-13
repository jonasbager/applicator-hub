import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qiowwdewasasyilriyfn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpb3d3ZGV3YXNhc3lpbHJpeWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5Njg5NjgsImV4cCI6MjA0OTU0NDk2OH0.sBuZXEglaylseHuJjWuAQhmVcj6ipU85TsWzM2C4Owc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
