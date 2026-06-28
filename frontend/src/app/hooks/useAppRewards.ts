import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ENTITLEMENT_STALE_MS, entitlementQueryKeys } from '../../hooks/entitlementQueries.ts';
import { activateReferralAfterDailySession, fetchReferralOffer } from '../../lib/supabase.js';

type AppRewardUser = {
    id?: string | null;
} | null | undefined;

type ReferralOffer = {
    discount_percent?: number;
    eligible?: boolean;
    expires_at?: string | null;
    offer_id?: string | null;
    [key: string]: unknown;
} | null;

type RewardPreview = {
    finalXp: number;
};

type UseAppRewardsOptions = {
    logXp: (xp: number) => void;
    setReferralOffer: Dispatch<SetStateAction<ReferralOffer>>;
    setUserXp: Dispatch<SetStateAction<number>>;
    userRef: MutableRefObject<AppRewardUser>;
};

export function useAppRewards({
    logXp,
    setReferralOffer,
    setUserXp,
    userRef,
}: UseAppRewardsOptions) {
    const queryClient = useQueryClient();

    const getRewardXp = useCallback((xp: number): number => {
        if (!xp || xp <= 0) return 0;
        return xp;
    }, []);

    const getRewardPreview = useCallback((xp: number): RewardPreview | null => {
        if (!xp || xp <= 0) return null;
        return { finalXp: xp };
    }, []);

    const addBonusXp = useCallback((xp: number) => {
        const finalXp = getRewardXp(xp);
        if (!finalXp) return;
        setUserXp(prev => prev + finalXp);
        logXp(finalXp);
    }, [getRewardXp, logXp, setUserXp]);

    const handleHanjaAcquired = useCallback((_id: unknown, xpAmount = 10) => {
        const finalXp = getRewardXp(xpAmount);
        if (!finalXp) return;
        setUserXp(prev => prev + finalXp);
        logXp(finalXp);
    }, [getRewardXp, logXp, setUserXp]);

    const activateReferralForDailyClear = useCallback(async () => {
        if (!userRef.current) return;
        const userId = userRef.current.id;
        const result = await activateReferralAfterDailySession();
        if (result?.rewardXp) addBonusXp(Number(result.rewardXp));
        queryClient.invalidateQueries({ queryKey: entitlementQueryKeys.referralSummaryRoot });
        const offer = await queryClient.fetchQuery({
            queryKey: entitlementQueryKeys.referralOffer(userId),
            queryFn: async () => {
                const { offer: nextOffer } = await fetchReferralOffer();
                return (nextOffer || null) as ReferralOffer;
            },
            staleTime: ENTITLEMENT_STALE_MS,
        });
        setReferralOffer(offer || null);
    }, [addBonusXp, queryClient, setReferralOffer, userRef]);

    return {
        activateReferralForDailyClear,
        addBonusXp,
        getRewardPreview,
        getRewardXp,
        handleHanjaAcquired,
    };
}
