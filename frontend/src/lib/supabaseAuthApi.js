import { ensureInternalAccount } from './supabaseAccountApi.js';
import { getDeviceId, getOAuthRedirectTo, supabase } from './supabaseClient.js';

export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
};

export const signInWithKakao = async ({ skipBrowserRedirect = false } = {}) => {
  if (!supabase) return { success: false, error: 'offline' };
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: getOAuthRedirectTo(),
      skipBrowserRedirect,
      queryParams: { prompt: 'login' },
    },
  });
  if (error) return { success: false, error };
  return { success: true, url: data?.url };
};

export const signInWithAppleToken = async (identityToken) => {
  if (!supabase) return { error: 'offline' };
  return supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
};

export const signInWithGoogleToken = async (idToken) => {
  if (!supabase) return { error: 'offline' };
  return supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
};

export const signOut = async () => {
  if (!supabase) return { error: null };
  return supabase.auth.signOut({ scope: 'local' });
};

export const linkAuthToDevice = async (userId) => {
  if (!supabase) return;
  const deviceId = getDeviceId();
  for (const table of ['user_profiles', 'learning_data']) {
    const { data: linkedRows } = await supabase
      .from(table)
      .select('device_id')
      .eq('auth_user_id', userId)
      .limit(1);
    if (linkedRows?.length) continue;
    await supabase.from(table)
      .update({ auth_user_id: userId })
      .eq('device_id', deviceId);
  }
  await ensureInternalAccount();
};
