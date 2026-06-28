import { createClient } from '@supabase/supabase-js';
import { SK } from '../constants/storageKeys.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const NATIVE_AUTH_REDIRECT_URL = 'com.soujinne.hanjaexplorer://auth-callback';

export const getOAuthRedirectTo = () => {
  const platform = window?.Capacitor?.getPlatform?.();
  if (platform && platform !== 'web') return NATIVE_AUTH_REDIRECT_URL;
  return import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
};

export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, storage: localStorage, flowType: 'pkce' },
    realtime: { params: { eventsPerSecond: 2 } },
  })
  : null;

export const getDeviceId = () => {
  try {
    let id = localStorage.getItem(SK.DEVICE_ID);
    if (!id) {
      id = `hj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(SK.DEVICE_ID, id);
    }
    return id;
  } catch (e) {
    return 'hj_offline';
  }
};
