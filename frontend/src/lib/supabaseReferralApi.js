import { SK } from '../constants/storageKeys.js';
import { supabase } from './supabaseClient.js';
import {
  cacheReferralOffer,
  clearPendingReferralCode,
  getCachedReferralOffer,
  getPendingReferralCode,
  normalizeReferralCode,
} from './supabaseReferralStorage.js';

const isMissingReferralModel = (error) => (
  error?.code === 'PGRST202'
  || error?.code === '42883'
  || error?.message?.includes('referral')
);

export const fetchMyReferralCode = async () => {
  if (!supabase) return { supported: false, code: null, error: 'offline' };
  const { data, error } = await supabase.rpc('get_my_referral_code');
  if (error) {
    if (isMissingReferralModel(error)) return { supported: false, code: null, error: null };
    return { supported: true, code: null, error };
  }
  const code = normalizeReferralCode(data);
  try { if (code) localStorage.setItem(SK.REFERRAL_CODE, code); } catch {}
  return { supported: true, code, error: null };
};

export const acceptPendingReferral = async () => {
  if (!supabase) return { supported: false, accepted: false, error: 'offline' };
  const code = getPendingReferralCode();
  if (!code) return { supported: true, accepted: false, error: null };
  const { data, error } = await supabase.rpc('accept_referral', { p_code: code });
  if (error) {
    if (isMissingReferralModel(error)) return { supported: false, accepted: false, error: null };
    return { supported: true, accepted: false, error };
  }
  if (data?.accepted || data?.reason === 'already_referred') clearPendingReferralCode();
  return { supported: true, accepted: !!data?.accepted, data, error: null };
};

export const fetchReferralOffer = async () => {
  if (!supabase) return { supported: false, offer: getCachedReferralOffer(), error: 'offline' };
  const { data, error } = await supabase.rpc('get_my_referral_offer');
  if (error) {
    if (isMissingReferralModel(error)) return { supported: false, offer: getCachedReferralOffer(), error: null };
    return { supported: true, offer: getCachedReferralOffer(), error };
  }
  cacheReferralOffer(data);
  return { supported: true, offer: data?.eligible ? data : null, error: null };
};

export const fetchReferralSummary = async () => {
  if (!supabase) return { supported: false, summary: null, error: 'offline' };
  const { data, error } = await supabase.rpc('get_my_referral_summary');
  if (error) {
    if (isMissingReferralModel(error)) return { supported: false, summary: null, error: null };
    return { supported: true, summary: null, error };
  }
  if (data?.active_offer) cacheReferralOffer(data.active_offer);
  return { supported: true, summary: data, error: null };
};

export const activateReferralAfterDailySession = async () => {
  if (!supabase) return { supported: false, activated: false, rewardXp: 0, error: 'offline' };
  const { data, error } = await supabase.rpc('activate_my_referral');
  if (error) {
    if (isMissingReferralModel(error)) return { supported: false, activated: false, rewardXp: 0, error: null };
    return { supported: true, activated: false, rewardXp: 0, error };
  }
  if (data?.offer?.eligible) cacheReferralOffer(data.offer);
  try {
    if (data?.activated) localStorage.setItem(SK.REFERRAL_ACTIVATED, 'true');
  } catch {}
  return {
    supported: true,
    activated: !!data?.activated,
    rewardXp: Number(data?.referred_reward_xp || 0),
    data,
    error: null,
  };
};

export const consumeMyReferralOffer = async (offerId) => {
  if (!supabase || !offerId) return { supported: false, consumed: false, error: 'offline' };
  const { data, error } = await supabase.rpc('consume_my_referral_offer', { p_offer_id: offerId });
  if (error) {
    if (isMissingReferralModel(error)) return { supported: false, consumed: false, error: null };
    return { supported: true, consumed: false, error };
  }
  if (data?.consumed) cacheReferralOffer(null);
  return { supported: true, consumed: !!data?.consumed, data, error: null };
};
