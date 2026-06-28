import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SK } from '../../constants/storageKeys.js';
import {
    ENTITLEMENT_STALE_MS,
    entitlementQueryKeys,
    invalidateEntitlementQueries,
} from '../../hooks/entitlementQueries.ts';
import {
    acceptPendingReferral,
    captureReferralFromUrl,
    fetchReferralOffer,
    fetchUnlockedPack,
    getCachedReferralOffer,
} from '../../lib/supabase.js';

type AppEntitlementUser = {
    id?: string | null;
} | null | undefined;

type ReferralOffer = {
    discount_percent?: number;
    eligible?: boolean;
    expires_at?: string | null;
    offer_id?: string | null;
    [key: string]: unknown;
} | null;

type ReferralOfferUpdate = ReferralOffer | ((current: ReferralOffer) => ReferralOffer);
type UnlockedPackUpdate = number | ((current: number) => number);

export function useAppEntitlements(user: AppEntitlementUser) {
    const queryClient = useQueryClient();
    const userId = user?.id || null;

    const unlockedPackQuery = useQuery<number>({
        queryKey: entitlementQueryKeys.unlockedPack(userId),
        queryFn: async () => Number(await fetchUnlockedPack()) || 0,
        enabled: Boolean(user),
        staleTime: ENTITLEMENT_STALE_MS,
        placeholderData: 0,
    });

    const referralOfferQuery = useQuery<ReferralOffer>({
        queryKey: entitlementQueryKeys.referralOffer(userId),
        queryFn: async () => {
            const { offer } = await fetchReferralOffer();
            return (offer || null) as ReferralOffer;
        },
        enabled: Boolean(user),
        staleTime: ENTITLEMENT_STALE_MS,
        placeholderData: () => getCachedReferralOffer() as ReferralOffer,
    });

    const unlockedPack = user ? Number(unlockedPackQuery.data || 0) : 0;
    const referralOffer = user ? referralOfferQuery.data || null : null;

    const setUnlockedPack = useCallback((next: UnlockedPackUpdate) => {
        const queryKey = entitlementQueryKeys.unlockedPack(userId);
        const current = Number(queryClient.getQueryData(queryKey) || 0);
        const pack = Number(typeof next === 'function' ? next(current) : next) || 0;
        queryClient.setQueryData(queryKey, pack);
        localStorage.setItem('unlocked_pack', String(pack));
    }, [queryClient, userId]);

    const setReferralOffer = useCallback((next: ReferralOfferUpdate) => {
        const queryKey = entitlementQueryKeys.referralOffer(userId);
        const current = (queryClient.getQueryData(queryKey) || null) as ReferralOffer;
        const offer = typeof next === 'function' ? next(current) : next;
        queryClient.setQueryData(queryKey, offer || null);
        if (!offer) localStorage.removeItem(SK.REFERRAL_OFFER);
    }, [queryClient, userId]);

    useEffect(() => {
        captureReferralFromUrl();
    }, []);

    useEffect(() => {
        if (!user) {
            queryClient.setQueryData(entitlementQueryKeys.unlockedPack(userId), 0);
            queryClient.setQueryData(entitlementQueryKeys.referralOffer(userId), null);
            localStorage.removeItem('unlocked_pack');
            localStorage.removeItem(SK.REFERRAL_OFFER);
            return;
        }

        let active = true;
        acceptPendingReferral().finally(() => {
            if (!active) return;
            queryClient.invalidateQueries({ queryKey: entitlementQueryKeys.referralOffer(userId) });
            queryClient.invalidateQueries({ queryKey: entitlementQueryKeys.referralSummaryRoot });
        });
        return () => {
            active = false;
        };
    }, [queryClient, user, userId]);

    useEffect(() => {
        if (!user) return;
        localStorage.setItem('unlocked_pack', String(unlockedPack));
    }, [unlockedPack, user]);

    useEffect(() => {
        if (!user) return undefined;

        const refreshEntitlement = () => {
            if (document.visibilityState !== 'visible') return;
            invalidateEntitlementQueries(queryClient, userId);
        };

        document.addEventListener('visibilitychange', refreshEntitlement);
        window.addEventListener('focus', refreshEntitlement);
        return () => {
            document.removeEventListener('visibilitychange', refreshEntitlement);
            window.removeEventListener('focus', refreshEntitlement);
        };
    }, [queryClient, user, userId]);

    return {
        referralOffer,
        setReferralOffer,
        unlockedPack,
        setUnlockedPack,
        isPremium: unlockedPack > 0,
    };
}
