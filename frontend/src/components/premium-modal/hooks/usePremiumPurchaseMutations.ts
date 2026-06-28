import { useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLang } from '../../../hooks/useLang.js';
import type { QueryClient } from '@tanstack/react-query';
import {
    entitlementQueryKeys,
    invalidateEntitlementQueries,
} from '../../../hooks/entitlementQueries.ts';
import { consumeMyReferralOffer, fetchUnlockedPack } from '../../../lib/supabase.js';

type ReferralOffer = {
    offer_id?: string | null;
} | null | undefined;

type PurchaseResult = {
    cancelled?: boolean;
    error?: string;
    pack?: number;
    success?: boolean;
};

type PurchasePackage = (
    packId: string,
    options?: { referralOffer?: ReferralOffer },
) => Promise<PurchaseResult>;

type RestorePurchases = () => Promise<PurchaseResult>;
type Translate = (key: string, params?: Record<string, string | number>) => string;

type UsePremiumPurchaseMutationsOptions = {
    activeReferralOffer?: ReferralOffer;
    onClose?: () => void;
    onPurchaseSuccess?: (pack: number) => void;
    onReferralOfferConsumed?: () => void;
    purchasePackage: PurchasePackage;
    restorePurchases: RestorePurchases;
    userId?: string | null;
};

type VerifyServerEntitlementOptions = {
    expectedPack: number;
    queryClient: QueryClient;
    userId?: string | null;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (!error) return '';
    return error instanceof Error
        ? error.message || fallback
        : fallback;
};

const verifyServerEntitlement = async ({
    expectedPack,
    queryClient,
    userId,
}: VerifyServerEntitlementOptions): Promise<number> => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const serverPack = await queryClient.fetchQuery({
            queryKey: entitlementQueryKeys.unlockedPack(userId),
            queryFn: fetchUnlockedPack,
            staleTime: 0,
        });
        if (serverPack === expectedPack || serverPack === 3) {
            queryClient.setQueryData(entitlementQueryKeys.unlockedPack(userId), serverPack);
            return serverPack;
        }
        await wait(2000);
    }
    return 0;
};

export const usePremiumPurchaseMutations = ({
    activeReferralOffer,
    onClose,
    onPurchaseSuccess,
    onReferralOfferConsumed,
    purchasePackage,
    restorePurchases,
    userId,
}: UsePremiumPurchaseMutationsOptions) => {
    const queryClient = useQueryClient();
    const { t } = useLang() as { t: Translate };

    const consumeReferralOffer = useCallback(async () => {
        if (!activeReferralOffer?.offer_id) return;
        const result = await consumeMyReferralOffer(activeReferralOffer.offer_id);
        if (result.consumed) {
            await invalidateEntitlementQueries(queryClient, userId);
            onReferralOfferConsumed?.();
        }
    }, [activeReferralOffer, onReferralOfferConsumed, queryClient, userId]);

    const completeVerifiedPurchase = useCallback(async ({
        consumeReferral,
        failureMessage,
        pack,
    }: {
        consumeReferral: boolean;
        failureMessage: string;
        pack: number;
    }) => {
        const verifiedPack = await verifyServerEntitlement({ expectedPack: pack, queryClient, userId });
        if (verifiedPack <= 0) throw new Error(failureMessage);

        if (consumeReferral) await consumeReferralOffer();
        await invalidateEntitlementQueries(queryClient, userId);
        queryClient.setQueryData(entitlementQueryKeys.unlockedPack(userId), verifiedPack);

        onPurchaseSuccess?.(verifiedPack);
        onClose?.();
        return verifiedPack;
    }, [consumeReferralOffer, onClose, onPurchaseSuccess, queryClient, userId]);

    const buyNativeMutation = useMutation({
        mutationFn: async ({
            referralOffer,
            selected,
        }: {
            referralOffer?: ReferralOffer;
            selected: string;
        }) => {
            const result = await purchasePackage(selected, { referralOffer });
            if (result.cancelled) return { cancelled: true };
            if (!result.success || Number(result.pack || 0) <= 0) {
                throw new Error(t('ext_2586'));
            }
            const pack = await completeVerifiedPurchase({
                consumeReferral: true,
                failureMessage: t('ext_2738'),
                pack: Number(result.pack),
            });
            return { cancelled: false, pack };
        },
    });

    const restoreNativeMutation = useMutation({
        mutationFn: async () => {
            const result = await restorePurchases();
            if (result.success && Number(result.pack || 0) > 0) {
                const pack = await completeVerifiedPurchase({
                    consumeReferral: false,
                    failureMessage: t('ext_2773'),
                    pack: Number(result.pack),
                });
                return { pack };
            }
            if (result.success && result.pack === 0) {
                throw new Error(t('ext_2092'));
            }
            throw new Error(t('ext_2093'));
        },
    });

    const reset = useCallback(() => {
        buyNativeMutation.reset();
        restoreNativeMutation.reset();
    }, [buyNativeMutation, restoreNativeMutation]);

    return useMemo(() => ({
        buyNative: buyNativeMutation.mutateAsync,
        errorMsg: getErrorMessage(buyNativeMutation.error || restoreNativeMutation.error, t('ext_2586')),
        isProcessing: buyNativeMutation.isPending || restoreNativeMutation.isPending,
        reset,
        restoreNative: restoreNativeMutation.mutateAsync,
    }), [
        buyNativeMutation.error,
        buyNativeMutation.isPending,
        buyNativeMutation.mutateAsync,
        reset,
        restoreNativeMutation.error,
        restoreNativeMutation.isPending,
        restoreNativeMutation.mutateAsync,
    ]);
};
