import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a custom storage object to handle the "remember me" functionality
const customStorage = {
  getItem: (key) => {
    // Try to get from localStorage first (for "remember me")
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;
    
    // Fall back to sessionStorage (for session-only login)
    return sessionStorage.getItem(key);
  },
  setItem: (key, value, rememberMe = false) => {
    if (rememberMe) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase;
        