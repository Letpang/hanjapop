import { useCallback, useMemo, useState } from 'react';
import { useLang } from '../../../hooks/useLang.js';
import { useRevenueCat } from '../../../hooks/useRevenueCat.js';
import { getPlatform } from '../../../hooks/useAuth.js';
import { openCheckout } from '../../../utils/paymentUtils.js';
import { getOfferDaysLeft, getPackDisplayPrice, PACKS } from '../premiumPacks.js';
import { usePremiumPurchaseMutations } from './usePremiumPurchaseMutations.ts';

const getReferralWebVariantId = (discountPercent) => (
    discountPercent >= 50
        ? String(import.meta.env.VITE_LEMON_REFERRAL_FULLPACK_50_VARIANT_ID || '').trim()
        : String(import.meta.env.VITE_LEMON_REFERRAL_FULLPACK_20_VARIANT_ID || import.meta.env.VITE_LEMON_REFERRAL_FULLPACK_VARIANT_ID || '').trim()
);

export const usePremiumCheckout = ({
    user,
    referralOffer,
    onClose,
    onShowLogin,
    onPurchaseSuccess,
    onReferralOfferConsumed,
}) => {
    const { t } = useLang();
    const [selected, setSelected] = useState('fullpack');
    const [errorMsg, setErrorMsg] = useState('');
    const { initialized, packages, loading, purchasePackage, restorePurchases } = useRevenueCat({ enabled: !!user });

    const userId = user?.id || null;
    const isNative = getPlatform() !== 'web';
    const referralDiscountPercent = Number(referralOffer?.discount_percent || 20);
    const referralNativePackageId = referralDiscountPercent >= 50 ? 'fullpack_referral50' : 'fullpack_referral20';
    const referralWebVariantId = getReferralWebVariantId(referralDiscountPercent);
    const hasReferralCheckout = isNative
        ? Boolean(packages[referralNativePackageId])
        : Boolean(referralWebVariantId);
    const activeReferralOffer = referralOffer?.eligible && hasReferralCheckout ? referralOffer : null;
    const selectedPack = PACKS.find(pack => pack.id === selected) || PACKS[2];

    const offerExpiryLabel = useMemo(() => {
        if (!activeReferralOffer) return '';
        const daysLeft = getOfferDaysLeft(activeReferralOffer);
        return daysLeft ? t('ext_3204', { n: daysLeft }) : t('ext_1480');
    }, [activeReferralOffer, t]);

    const purchaseMutations = usePremiumPurchaseMutations({
        activeReferralOffer,
        onClose,
        onPurchaseSuccess,
        onReferralOfferConsumed,
        purchasePackage,
        restorePurchases,
        userId,
    });

    const handleBuy = useCallback(async () => {
        setErrorMsg('');
        purchaseMutations.reset();

        if (!user) {
            onShowLogin?.();
            return;
        }

        if (isNative) {
            if (!initialized) {
                setErrorMsg(t('ext_2668'));
                return;
            }

            try {
                await purchaseMutations.buyNative({ selected, referralOffer: activeReferralOffer });
            } catch {}
            return;
        }

        const result = await openCheckout(selected, user.email || '', activeReferralOffer);
        if (!result.success) onShowLogin?.();
    }, [
        activeReferralOffer,
        initialized,
        isNative,
        onShowLogin,
        purchaseMutations,
        selected,
        user,
    ]);

    const handleRestore = useCallback(async () => {
        setErrorMsg('');
        purchaseMutations.reset();

        if (!user) {
            onShowLogin?.();
            return;
        }
        if (!isNative) return;

        try {
            await purchaseMutations.restoreNative();
        } catch {}
    }, [isNative, onShowLogin, purchaseMutations, user]);

    const checkoutErrorMsg = errorMsg || purchaseMutations.errorMsg;
    const verifying = purchaseMutations.isProcessing;
    const purchaseLabel = verifying
        ? t('ext_1748')
        : loading
            ? t('ext_1614')
            : t('ext_3205', { price: getPackDisplayPrice(selectedPack, activeReferralOffer) });

    return {
        activeReferralOffer,
        errorMsg: checkoutErrorMsg,
        isNative,
        loading,
        offerExpiryLabel,
        purchaseLabel,
        selected,
        verifying,
        handleBuy,
        handleRestore,
        setSelected,
    };
};
