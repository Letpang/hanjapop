import { tOrFallback } from '../../i18n/fallbackText.js';

export const PACKS = [
    {
        id: 'pack1',
        title: 'ext_1069',
        subtitle: 'ext_1615',
        desc: 'ext_2034',
        price: '₩9,900',
        color: '#7C83FF',
        bg: '#F5F5FF',
        badge: null,
    },
    {
        id: 'pack2',
        title: 'ext_1070',
        subtitle: 'ext_1655',
        desc: 'ext_2035',
        price: '₩13,900',
        color: '#FF9B73',
        bg: '#FFF7F3',
        badge: null,
    },
    {
        id: 'fullpack',
        title: 'ext_1071',
        subtitle: 'ext_1795',
        desc: 'ext_2714',
        price: '₩19,900',
        color: '#2ED6C5',
        bg: '#F0FEFA',
        badge: 'BEST',
    },
];

const REFERRAL_FULLPACK_PRICES = {
    20: '₩15,900',
    50: '₩9,900',
};

const parseWon = (value) => Number(String(value || '').replace(/[^\d]/g, '')) || 0;

const formatWon = (value) => {
    const rounded = Math.round(Number(value || 0) / 100) * 100;
    return `₩${rounded.toLocaleString('ko-KR')}`;
};

export const getReferralPrice = (pack, referralOffer, t) => {
    if (!pack) return null;
    if (!referralOffer?.eligible || pack.id !== 'fullpack') return null;

    const percent = Math.max(0, Math.min(100, Number(referralOffer.discount_percent || 20)));
    const originalPrice = parseWon(pack.price);
    const discountedPrice = originalPrice * (100 - percent) / 100;
    const fixedDiscountedPrice = percent >= 50
        ? REFERRAL_FULLPACK_PRICES[50]
        : percent >= 20
            ? REFERRAL_FULLPACK_PRICES[20]
            : null;

    return {
        original: pack.price,
        discounted: percent >= 100 ? tOrFallback(t, 'ext_280') : fixedDiscountedPrice || formatWon(discountedPrice),
        label: `${percent}%`,
    };
};

export const getOfferDaysLeft = (offer) => {
    if (!offer?.expires_at) return null;
    const ms = new Date(offer.expires_at).getTime() - Date.now();
    if (ms <= 0) return null;
    return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
};

export const getPackDisplayPrice = (pack, referralOffer) => (
    getReferralPrice(pack, referralOffer)?.discounted || pack?.price || ''
);
