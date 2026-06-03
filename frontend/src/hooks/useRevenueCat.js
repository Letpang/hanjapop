import { useState, useEffect, useCallback } from 'react';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { getPlatform } from './useAuth.js';
import { RC_API_KEY_IOS, RC_API_KEY_ANDROID, RC_PRODUCT_IDS, entitlementsToPack } from '../utils/rcConfig.js';

export const useRevenueCat = () => {
    const [initialized, setInitialized] = useState(false);
    const [packages, setPackages] = useState({});   // { pack1: pkg, pack2: pkg, fullpack: pkg }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const platform = getPlatform();
        if (platform === 'web') return;

        (async () => {
            try {
                const apiKey = platform === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
                await Purchases.configure({ apiKey });

                const { current } = await Purchases.getOfferings();
                if (!current) return;

                // package identifier → pack ID 매핑
                const pkgMap = {};
                for (const pkg of current.availablePackages) {
                    const match = Object.entries(RC_PRODUCT_IDS).find(
                        ([, id]) => pkg.product.identifier === id
                    );
                    if (match) pkgMap[match[0]] = pkg;
                }
                setPackages(pkgMap);
                setInitialized(true);
            } catch (e) {
                console.warn('[RevenueCat] 초기화 실패:', e);
            }
        })();
    }, []);

    // pack1 / pack2 / fullpack 구매
    const purchasePackage = useCallback(async (packId) => {
        const pkg = packages[packId];
        if (!pkg) return { success: false, error: 'package_not_found' };

        setLoading(true);
        try {
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
            const pack = entitlementsToPack(customerInfo.entitlements.active);
            return { success: true, pack };
        } catch (e) {
            if (e.userCancelled) return { success: false, cancelled: true };
            return { success: false, error: e.message ?? 'unknown' };
        } finally {
            setLoading(false);
        }
    }, [packages]);

    // 구매 복원 (기기 변경 / 재설치 시)
    const restorePurchases = useCallback(async () => {
        setLoading(true);
        try {
            const { customerInfo } = await Purchases.restorePurchases();
            const pack = entitlementsToPack(customerInfo.entitlements.active);
            return { success: true, pack };
        } catch (e) {
            return { success: false, error: e.message ?? 'unknown' };
        } finally {
            setLoading(false);
        }
    }, []);

    return { initialized, packages, loading, purchasePackage, restorePurchases };
};
