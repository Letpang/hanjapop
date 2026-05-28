/**
 * paymentUtils.js
 * Lemon Squeezy 결제 연동 유틸
 */

import { getDeviceId } from '../lib/supabase.js';

const LS_STORE = 'hanjapop';

// 팩별 Lemon Squeezy 바리언트 ID
const PACK_VARIANT_IDS = {
    pack1:    '1085100',    // 기초 팩 18~51단계 ₩9,900
    pack2:    '1700393',    // 심화 팩 52~124단계 ₩13,900
    fullpack: '1711552',    // 전체 팩 18~124단계 ₩19,900
};

export const openCheckout = (packId = 'fullpack', email = '') => {
    const variantId = PACK_VARIANT_IDS[packId] || PACK_VARIANT_IDS.fullpack;
    const deviceId = getDeviceId();
    const params = [`checkout[custom][device_id]=${encodeURIComponent(deviceId)}`];
    if (email) params.push(`checkout[email]=${encodeURIComponent(email)}`);
    const url = `https://${LS_STORE}.lemonsqueezy.com/checkout/buy/${variantId}?${params.join('&')}`;
    if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(url);
    } else {
        window.open(url, '_blank');
    }
};
