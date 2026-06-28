import type { Dispatch, SetStateAction } from 'react';
import type { Provider, SupabaseClient, User } from '@supabase/supabase-js';
import {
  NATIVE_AUTH_REDIRECT_URL,
  getOAuthRedirectTo,
  signInWithAppleToken,
  signInWithGoogleToken,
  signInWithKakao as supabaseSignInWithKakao,
  supabase,
} from '../lib/supabase.js';

export type AppUser = User | null;
export type NativeUrlListener = { remove?: () => void | Promise<void> };
export type Translate = (key: string) => string;
export type LangApi = { t: Translate };

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
let googleAuthReady = false;

export const getCapacitorPlugin = (name: string): any => window?.Capacitor?.Plugins?.[name] ?? null;

export const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : String(error)
);

export const requireSupabase = (): SupabaseClient => {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
};

export const getPlatform = (): string => {
  if (window?.Capacitor?.getPlatform) return window.Capacitor.getPlatform();
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'web';
};

export const getAuthErrorDisplayMessage = (errorDescription: string, t: Translate) => (
  errorDescription.includes('already linked') ? t('authAlreadyLinked') : errorDescription
);

export const applyNativeAuthUrl = async (
  url: string | null | undefined,
  setUser: Dispatch<SetStateAction<AppUser>>,
  t: Translate,
): Promise<boolean> => {
  if (!url?.startsWith(NATIVE_AUTH_REDIRECT_URL)) return false;
  const parsed = new URL(url);
  const hash = new URLSearchParams((parsed.hash || '').replace(/^#/, ''));
  const errorDescription = parsed.searchParams.get('error_description') || hash.get('error_description');
  if (errorDescription) {
    alert(getAuthErrorDisplayMessage(errorDescription, t));
    return false;
  }

  const code = parsed.searchParams.get('code');
  if (code) {
    const { data, error } = await requireSupabase().auth.exchangeCodeForSession(code);
    if (error) throw error;
    setUser(data.session?.user ?? null);
    return true;
  }

  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) {
    const { data, error } = await requireSupabase().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    setUser(data.session?.user ?? null);
    return true;
  }
  return false;
};

export const signInWithAppleProvider = async () => {
  if (getPlatform() === 'web') {
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'login' },
      },
    });
    if (error) throw error;
    return { success: true };
  }

  const plugin = getCapacitorPlugin('SignInWithApple');
  if (!plugin) throw new Error('SignInWithApple plugin not available');
  const { response } = await plugin.authorize({
    clientId: 'com.soujinne.hanjaexplorer',
    redirectURI: 'https://mjcvtcjdlttxpsgieebv.supabase.co/auth/v1/callback',
    scopes: 'email name',
    state: Math.random().toString(36).slice(2),
  });
  const { error } = await signInWithAppleToken(response.identityToken);
  if (error) throw error;
  return { success: true };
};

export const signInWithGoogleProvider = async () => {
  if (getPlatform() === 'web') {
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    return { success: true };
  }

  const plugin = getCapacitorPlugin('GoogleAuth');
  if (!plugin) throw new Error('GoogleAuth plugin not available');
  if (!googleAuthReady && plugin.initialize) {
    await plugin.initialize({
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    googleAuthReady = true;
  }
  const googleUser = await plugin.signIn();
  const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
  if (!idToken) throw new Error('GoogleAuth did not return an idToken');
  const { error } = await signInWithGoogleToken(idToken);
  if (error) throw error;
  return { success: true };
};

export const signInWithKakaoProvider = async () => {
  const isNative = getPlatform() !== 'web';
  const result = await supabaseSignInWithKakao({ skipBrowserRedirect: isNative });
  if (!result.success) throw result.error;
  if (isNative) {
    if (!result.url) throw new Error('Kakao OAuth URL was not returned');
    window.location.href = result.url;
  }
  return { success: true };
};

export const linkAuthIdentity = async (provider: string, t: Translate) => {
  try {
    const isNative = getPlatform() !== 'web';
    const { data, error } = await requireSupabase().auth.linkIdentity({
      provider: provider as Provider,
      options: {
        redirectTo: getOAuthRedirectTo(),
        skipBrowserRedirect: isNative,
      },
    });
    if (error) throw error;
    if (isNative && data?.url) {
      window.location.href = data.url;
    }
    return { success: true };
  } catch (e) {
    console.error(`[useAuth] linkIdentity failed for ${provider}:`, e);
    alert(`${t('authLinkFailed')}${getErrorMessage(e)}`);
    return { success: false, error: e };
  }
};
