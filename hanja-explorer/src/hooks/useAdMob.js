import { useEffect, useRef, useCallback } from 'react';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// ────────────────────────────────────────────
// ✅ 실제 광고 단위 ID (플랫폼별)
// ────────────────────────────────────────────
const AD_UNITS_ANDROID = {
    BANNER:       'ca-app-pub-8731380411071344/3732020191',
};

const AD_UNITS_IOS = {
    BANNER:       'ca-app-pub-8731380411071344/8444450509',
    INTERSTITIAL: 'ca-app-pub-8731380411071344/8908544429',
};

const AD_UNITS = Capacitor.getPlatform() === 'ios' ? AD_UNITS_IOS : AD_UNITS_ANDROID;

export function useAdMob({ onAfterInterstitial } = {}) {
    const initializedRef = useRef(false);
    const initPromiseRef = useRef(null);
    const interstitialCount = useRef(0);

    // ── 1. 초기화 로직 (함수 정의) ─────────────────────────────
    const initializeAdMob = useCallback(async () => {
        if (initializedRef.current) return;
        if (initPromiseRef.current) return initPromiseRef.current;

        initPromiseRef.current = (async () => {
            try {
                const isAndroid = Capacitor.getPlatform() === 'android';
                
                // ✅ 초기화 수행
                // requestTrackingAuthorization: true 설정으로 iOS에서 ATT 팝업 유도
                await AdMob.initialize({
                    requestTrackingAuthorization: true,
                    initializeForTesting: false,
                    // ✅ 일반용 앱으로 전환 (만 13세 이상 타겟)
                    tagForChildDirectedTreatment: false,
                    tagForUnderAgeOfConsent: false,
                });

                initializedRef.current = true;
                console.log(`[AdMob] 초기화 완료 (일반 모드 활성화)`);
            } catch (e) {
                console.warn('[AdMob] 초기화 실패:', e);
                throw e;
            } finally {
                initPromiseRef.current = null;
            }
        })();

        return initPromiseRef.current;
    }, []);

    // 앱 마운트 시 초기화 시도
    useEffect(() => {
        initializeAdMob();
    }, [initializeAdMob]);

    // ── 2. 전면 광고 표시 (iOS/Android 공통) ────────────
    const showInterstitial = useCallback(async () => {
        interstitialCount.current += 1;
        // 5회 호출마다 1회 표시
        if (interstitialCount.current % 5 !== 0) {
            console.log(`[AdMob] 전면 광고 스킵 (${interstitialCount.current}회째)`);
            return;
        }

        try {
            if (!initializedRef.current) {
                await initializeAdMob();
            }

            await AdMob.prepareInterstitial({ adId: AD_UNITS.INTERSTITIAL });
            await AdMob.showInterstitial();
            console.log('[AdMob] 전면 광고 표시');

            // 광고 종료 후 프리미엄 업셀 콜백
            onAfterInterstitial?.();
        } catch (e) {
            console.warn('[AdMob] 전면 광고 표시 실패:', e);
        }
    }, [initializeAdMob, onAfterInterstitial]);

    return { showInterstitial };
}
