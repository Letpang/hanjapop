import type { QueryClient } from '@tanstack/react-query';

export const ENTITLEMENT_STALE_MS = 30 * 1000;

type EntitlementUserId = string | null | undefined;

const currentUserKey = (userId: EntitlementUserId): string => userId || 'current';

export const entitlementQueryKeys = {
    all: ['entitlements'] as const,
    unlockedPack: (userId?: EntitlementUserId) => ['entitlements', 'unlocked-pack', currentUserKey(userId)] as const,
    referralOffer: (userId?: EntitlementUserId) => ['entitlements', 'referral-offer', currentUserKey(userId)] as const,
    referralSummaryRoot: ['entitlements', 'referral-summary'] as const,
    referralSummary: (userId?: EntitlementUserId) => ['entitlements', 'referral-summary', currentUserKey(userId)] as const,
};

export const invalidateEntitlementQueries = (queryClient: QueryClient, userId?: EntitlementUserId) => Promise.all([
    queryClient.invalidateQueries({ queryKey: entitlementQueryKeys.unlockedPack(userId) }),
    queryClient.invalidateQueries({ queryKey: entitlementQueryKeys.referralOffer(userId) }),
    queryClient.invalidateQueries({ queryKey: entitlementQueryKeys.referralSummaryRoot }),
]);
