import { SK } from '../constants/storageKeys.js';

export const normalizeReferralCode = (value) => String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);

export const cacheReferralOffer = (offer) => {
    try {
        if (offer?.eligible) localStorage.setItem(SK.REFERRAL_OFFER, JSON.stringify(offer));
        else localStorage.removeItem(SK.REFERRAL_OFFER);
    } catch {}
};

export const getCachedReferralOffer = () => {
    try {
        const offer = JSON.parse(localStorage.getItem(SK.REFERRAL_OFFER) || 'null');
        if (!offer?.eligible) return null;
        if (offer.expires_at && new Date(offer.expires_at).getTime() <= Date.now()) {
            localStorage.removeItem(SK.REFERRAL_OFFER);
            return null;
        }
        return offer;
    } catch {
        return null;
    }
};

export const captureReferralFromUrl = () => {
    try {
        const url = new URL(window.location.href);
        const code = normalizeReferralCode(url.searchParams.get('ref') || url.searchParams.get('referral'));
        if (!code) return null;
        localStorage.setItem(SK.PENDING_REFERRAL_CODE, code);
        return code;
    } catch {
        return null;
    }
};

export const getPendingReferralCode = () => {
    try { return normalizeReferralCode(localStorage.getItem(SK.PENDING_REFERRAL_CODE)); }
    catch { return ''; }
};

export const clearPendingReferralCode = () => {
    try { localStorage.removeItem(SK.PENDING_REFERRAL_CODE); } catch {}
};
