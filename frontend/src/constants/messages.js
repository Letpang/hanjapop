export const CELEB_MESSAGES = [
    'ext_1796',
    'ext_1969',
    'ext_1797',
    'ext_1798',
    'ext_1843',
    'ext_1799',
];

export const CLEAR_MESSAGES = [
    'ext_1800',
    'ext_1801',
    'ext_1802',
    'ext_1844',
    'ext_1749',
    'ext_1904',
    'ext_1845',
    'ext_1846',
    'ext_1750',
    'ext_1751',
];

export const pickClearMessage = () =>
    CLEAR_MESSAGES[Math.floor(Math.random() * CLEAR_MESSAGES.length)];
