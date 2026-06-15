import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

const IS_NATIVE = Capacitor.getPlatform() !== 'web';

const AD_UNITS = {
    ios:     { INTERSTITIAL: 'ca-app-pub-8731380411071344/8908544429' },
    android: { INTERSTITIAL: 'ca-app-pub-8731380411071344/9022935978' },
};
const UNIT = AD_UNITS[Capacitor.getPlatform()] ?? AD_UNITS.ios;

const getAdMob = () => window?.Capacitor?.Plugins?.AdMob ?? null;

export const useAdMob = ({ onAfterInterstitial } = {}) => {
    const initializedRef    = useRef(false);
    const initPromiseRef    = useRef(null);
    const interstitialCount = useRef(0);

    const initializeAdMob = useCallback(async () => {
        if (!IS_NATIVE) return;
        if (initializedRef.current) return;
        if (initPromiseRef.current) return initPromiseRef.current;

        initPromiseRef.current = (async () => {
            try {
                const AdMob = getAdMob();
                if (!AdMob) throw new Error('AdMob plugin not available');
                await AdMob.initialize({
                    requestTrackingAuthorization: true,
                    initializeForTesting: false,
                    tagForChildDirectedTreatment: false,
                    tagForUnderAgeOfConsent: false,
                });
                initializedRef.current = true;
            } catch (e) {
                console.warn('[AdMob] 초기화 실패:', e);
            } finally {
                initPromiseRef.current = null;
            }
        })();

        return initPromiseRef.current;
    }, []);

    useEffect(() => {
        initializeAdMob();
    }, [initializeAdMob]);

    const showInterstitial = useCallback(async () => {
        if (!IS_NATIVE) return;

        interstitialCount.current += 1;
        if (interstitialCount.current % 5 !== 0) return;

        try {
            if (!initializedRef.current) await initializeAdMob();
            const AdMob = getAdMob();
            if (!AdMob) return;
            await AdMob.prepareInterstitial({ adId: UNIT.INTERSTITIAL });
            await AdMob.showInterstitial();
            onAfterInterstitial?.();
        } catch (e) {
            console.warn('[AdMob] 전면 광고 실패:', e);
        }
    }, [initializeAdMob, onAfterInterstitial]);

    return { showInterstitial };
};
