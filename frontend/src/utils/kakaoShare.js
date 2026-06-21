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
            : reject(createShareError('SDK_LOAD_FAILED', '카카오 SDK를 불러오지 못했어요.'));
        const handleError = event => reject(createShareError('SDK_LOAD_FAILED', '카카오 SDK 연결에 실패했어요.', event));

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

export const initializeKakaoShare = async () => {
    const { javascriptKey, shareUrl } = getKakaoShareConfig();
    if (!javascriptKey) throw createShareError('MISSING_KEY', '카카오 JavaScript 키가 설정되지 않았어요.');
    if (!shareUrl || !/^https:\/\//i.test(shareUrl)) {
        throw createShareError('MISSING_URL', '카카오 공유용 앱 주소가 설정되지 않았어요.');
    }

    const Kakao = await loadScript();
    if (!Kakao.isInitialized()) Kakao.init(javascriptKey);
    if (!Kakao.isInitialized()) throw createShareError('INIT_FAILED', '카카오 SDK를 초기화하지 못했어요.');
    return { Kakao, shareUrl };
};

const toFileList = file => {
    if (typeof DataTransfer === 'undefined') return [file];
    const transfer = new DataTransfer();
    transfer.items.add(file);
    return transfer.files;
};

const sendTextShare = ({ Kakao, shareUrl, text }) => Kakao.Share.sendDefault({
    objectType: 'text',
    text,
    link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
    },
    buttonTitle: '한자팝 시작하기',
});

export const shareImageToKakao = async ({ file, title, description, fallbackText }) => {
    const { Kakao, shareUrl } = await initializeKakaoShare();
    const text = fallbackText || `${title}\n${description || ''}`;

    if (!file || file.size > MAX_KAKAO_IMAGE_BYTES) {
        await Promise.resolve(sendTextShare({ Kakao, shareUrl, text }));
        return { mode: 'text', imageFallback: true };
    }

    try {
        const upload = await Kakao.Share.uploadImage({ file: toFileList(file) });
        const imageUrl = upload?.infos?.original?.url;
        if (!imageUrl) throw createShareError('IMAGE_UPLOAD_FAILED', '이미지를 업로드하지 못했어요.');

        await Promise.resolve(Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title,
                description,
                imageUrl,
                link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
            },
            buttons: [{ title: '한자팝 시작하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
        }));
        return { mode: 'feed', imageFallback: false };
    } catch (error) {
        if (/cancel|close|canceled/i.test(String(error?.message || error))) throw error;
        await Promise.resolve(sendTextShare({ Kakao, shareUrl, text }));
        return { mode: 'text', imageFallback: true };
    }
};

export const shareMasterAchievementToKakao = async ({ file, nickname, hanjaCount }) => {
    const { Kakao, shareUrl } = await initializeKakaoShare();
    const safeNickname = nickname || '탐험가';
    const title = `${safeNickname}님의 124일 완주 인증서`;
    const description = `124일 탐험 완료 · ${hanjaCount}한자 마스터 · 황금 완주 배지 획득`;

    if (!file || file.size > MAX_KAKAO_IMAGE_BYTES) {
        await Promise.resolve(sendTextShare({ Kakao, shareUrl, text: `한자팝 마스터 탄생!\n${description}` }));
        return { mode: 'text', imageFallback: true };
    }

    try {
        const upload = await Kakao.Share.uploadImage({ file: toFileList(file) });
        const imageUrl = upload?.infos?.original?.url;
        if (!imageUrl) throw createShareError('IMAGE_UPLOAD_FAILED', '완주 이미지를 업로드하지 못했어요.');

        await Promise.resolve(Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title,
                description,
                imageUrl,
                imageWidth: 1080,
                imageHeight: 1080,
                link: {
                    mobileWebUrl: shareUrl,
                    webUrl: shareUrl,
                },
            },
            buttons: [{
                title: '한자팝 시작하기',
                link: {
                    mobileWebUrl: shareUrl,
                    webUrl: shareUrl,
                },
            }],
        }));
        return { mode: 'feed', imageFallback: false };
    } catch (error) {
        if (/cancel|close|canceled/i.test(String(error?.message || error))) throw error;
        await Promise.resolve(sendTextShare({ Kakao, shareUrl, text: `한자팝 마스터 탄생!\n${description}` }));
        return { mode: 'text', imageFallback: true };
    }
};
