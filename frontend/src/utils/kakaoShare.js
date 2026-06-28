import { fetchMyReferralCode } from '../lib/supabase.js';
import { tOrFallback } from '../i18n/fallbackText.js';

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';
const MAX_KAKAO_IMAGE_BYTES = 5 * 1024 * 1024;

let sdkPromise = null;

const createShareError = (code, message, cause) => {
    const error = new Error(message, cause ? { cause } : undefined);
    error.code = code;
    return error;
};

const loadScript = () => {
    if (window.Kakao) return Promise.resolve(window.Kakao);
    if (sdkPromise) return sdkPromise;

    sdkPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${KAKAO_SDK_URL}"]`);
        const script = existing || document.createElement('script');
        const handleLoad = () => window.Kakao
            ? resolve(window.Kakao)
            : reject(createShareError('SDK_LOAD_FAILED', 'Failed to load the Kakao SDK.'));
        const handleError = event => reject(createShareError('SDK_LOAD_FAILED', 'Failed to connect to the Kakao SDK.', event));

        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener('error', handleError, { once: true });
        if (!existing) {
            script.src = KAKAO_SDK_URL;
            script.async = true;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }
    }).catch(error => {
        sdkPromise = null;
        throw error;
    });
    return sdkPromise;
};

export const getKakaoShareConfig = () => {
    const publicAppUrl = String(import.meta.env.VITE_PUBLIC_APP_URL || '').trim().replace(/\/$/, '');
    const iosStoreUrl = String(import.meta.env.VITE_APP_STORE_URL_IOS || '').trim();
    const androidStoreUrl = String(import.meta.env.VITE_APP_STORE_URL_ANDROID || '').trim();
    const isIos = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const shareUrl = publicAppUrl || (isIos ? iosStoreUrl : androidStoreUrl) || iosStoreUrl || androidStoreUrl;
    return {
        javascriptKey: String(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY || '').trim(),
        publicAppUrl,
        iosStoreUrl,
        androidStoreUrl,
        shareUrl,
    };
};

export const initializeKakaoShare = async (t) => {
    const { javascriptKey, shareUrl } = getKakaoShareConfig();
    if (!javascriptKey) throw createShareError('MISSING_KEY', tOrFallback(t, 'ext_2606'));
    if (!shareUrl || !/^https:\/\//i.test(shareUrl)) {
        throw createShareError('MISSING_URL', tOrFallback(t, 'ext_2491'));
    }

    const Kakao = await loadScript();
    if (!Kakao.isInitialized()) Kakao.init(javascriptKey);
    if (!Kakao.isInitialized()) throw createShareError('INIT_FAILED', tOrFallback(t, 'ext_2327'));
    return { Kakao, shareUrl };
};

const buildTrackedShareUrl = async (shareUrl, campaign = 'share') => {
    try {
        const url = new URL(shareUrl);
        const { code } = await fetchMyReferralCode();
        if (code) url.searchParams.set('ref', code);
        url.searchParams.set('utm_source', 'kakao');
        url.searchParams.set('utm_campaign', campaign);
        return url.toString();
    } catch {
        return shareUrl;
    }
};

const toFileList = file => {
    if (typeof DataTransfer === 'undefined') return [file];
    const transfer = new DataTransfer();
    transfer.items.add(file);
    return transfer.files;
};

const sendTextShare = ({ Kakao, shareUrl, text, buttonTitle = 'Hanja Pop' }) => Kakao.Share.sendDefault({
    objectType: 'text',
    text,
    link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
    },
    buttonTitle,
});

export const shareImageToKakao = async ({
    file,
    title,
    description,
    fallbackText,
    campaign = 'achievement_share',
    buttonTitle = 'Hanja Pop',
    preferText = false,
    imageWidth,
    imageHeight,
    t,
}) => {
    const { Kakao, shareUrl } = await initializeKakaoShare(t);
    const trackedShareUrl = await buildTrackedShareUrl(shareUrl, campaign);
    const text = fallbackText || `${title}\n${description || ''}`;

    if (preferText || !file || file.size > MAX_KAKAO_IMAGE_BYTES) {
        await Promise.resolve(sendTextShare({ Kakao, shareUrl: trackedShareUrl, text, buttonTitle }));
        return { mode: 'text', imageFallback: true };
    }

    try {
        const upload = await Kakao.Share.uploadImage({ file: toFileList(file) });
        const imageUrl = upload?.infos?.original?.url;
        if (!imageUrl) throw createShareError('IMAGE_UPLOAD_FAILED', tOrFallback(t, 'ext_2147'));

        await Promise.resolve(Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title,
                description,
                imageUrl,
                ...(imageWidth && imageHeight ? { imageWidth, imageHeight } : {}),
                link: { mobileWebUrl: trackedShareUrl, webUrl: trackedShareUrl },
            },
            buttons: [{ title: buttonTitle, link: { mobileWebUrl: trackedShareUrl, webUrl: trackedShareUrl } }],
        }));
        return { mode: 'feed', imageFallback: false };
    } catch (error) {
        if (/cancel|close|canceled/i.test(String(error?.message || error))) throw error;
        await Promise.resolve(sendTextShare({ Kakao, shareUrl: trackedShareUrl, text, buttonTitle }));
        return { mode: 'text', imageFallback: true };
    }
};

export const shareMasterAchievementToKakao = async ({ file, title, description, fallbackText, buttonTitle = 'Hanja Pop', t }) => {
    const { Kakao, shareUrl } = await initializeKakaoShare(t);
    const trackedShareUrl = await buildTrackedShareUrl(shareUrl, 'master_complete');
    const text = fallbackText || `${title}\n${description || ''}`;

    if (!file || file.size > MAX_KAKAO_IMAGE_BYTES) {
        await Promise.resolve(sendTextShare({ Kakao, shareUrl: trackedShareUrl, text }));
        return { mode: 'text', imageFallback: true };
    }

    try {
        const upload = await Kakao.Share.uploadImage({ file: toFileList(file) });
        const imageUrl = upload?.infos?.original?.url;
        if (!imageUrl) throw createShareError('IMAGE_UPLOAD_FAILED', tOrFallback(t, 'ext_2289'));

        await Promise.resolve(Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title,
                description,
                imageUrl,
                imageWidth: 1080,
                imageHeight: 1080,
                link: {
                    mobileWebUrl: trackedShareUrl,
                    webUrl: trackedShareUrl,
                },
            },
            buttons: [{
                title: buttonTitle,
                link: {
                    mobileWebUrl: trackedShareUrl,
                    webUrl: trackedShareUrl,
                },
            }],
        }));
        return { mode: 'feed', imageFallback: false };
    } catch (error) {
        if (/cancel|close|canceled/i.test(String(error?.message || error))) throw error;
        await Promise.resolve(sendTextShare({ Kakao, shareUrl: trackedShareUrl, text }));
        return { mode: 'text', imageFallback: true };
    }
};
