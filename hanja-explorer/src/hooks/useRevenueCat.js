import { useState, useEffect, useCallback } from 'react';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const RC_API_KEY_IOS     = 'appl_pNzDkEyCUTMxnvWJuQzrpYocFeN';
const RC_API_KEY_ANDROID = 'goog_WZvGTzxNuyrupdLpaCxoIUZyqgF';

export const RC_PRODUCT_IDS = {
    pack1:    'com.soujinne.hanjaexplorer.pack1',
    pack2:    'com.soujinne.hanjaexplorer.pack2',
    fullpack: 'com.soujinne.hanjaexplorer.fullpack',
};

const RC_ENTITLEMENTS = { pack1: 'pack1', pack2: 'pack2', fullpack: 'fullpack' };

export const entitlementsToPack = (active) => {
    if (active[RC_ENTITLEMENTS.fullpack]) return 3;
    if (active[RC_ENTITLEMENTS.pack2])    return 2;
    if (active[RC_ENTITLEMENTS.pack1])    return 1;
    return 0;
};

export const useRevenueCat = () => {
    const [initialized, setInitialized] = useState(false);
    const [packages, setPackages] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const platform = Capacitor.getPlatform();
        if (platform === 'web') return;

        (async () => {
            try {
                const apiKey = platform === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
                await Purchases.configure({ apiKey });

                const { current } = await Purchases.getOfferings();
                if (!current) return;

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
