/**
 * paymentUtils.js
 * Lemon Squeezy 결제 연동 유틸
 */

import { ensureInternalAccount } from '../lib/supabase.js';

const LS_STORE = 'hanjapop';

// 팩별 Lemon Squeezy 바리언트 ID
const PACK_VARIANT_IDS = {
    pack1:    '1763592',    // 기초 팩 18~51단계 ₩9,900
    pack2:    '1763593',    // 심화 팩 52~124단계 ₩13,900
    fullpack: '1763594',    // 전체 팩 18~124단계 ₩19,900
};

export const openCheckout = async (packId = 'fullpack', email = '') => {
    const variantId = PACK_VARIANT_IDS[packId] || PACK_VARIANT_IDS.fullpack;
    const { accountId, error } = await ensureInternalAccount();
    if (error || !accountId) return { success: false, reason: 'login_required' };
    const params = [
        `variant=${variantId}`,
        `checkout[custom][account_id]=${encodeURIComponent(accountId)}`,
    ];
    if (email) params.push(`checkout[email]=${encodeURIComponent(email)}`);
    const url = `https://${LS_STORE}.lemonsqueezy.com/checkout?${params.join('&')}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true };
};
