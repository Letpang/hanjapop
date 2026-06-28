import PremiumModalActions from './premium-modal/components/PremiumModalActions.jsx';
import PremiumModalHeader from './premium-modal/components/PremiumModalHeader.jsx';
import PremiumModalShell from './premium-modal/components/PremiumModalShell.jsx';
import PremiumPackList from './premium-modal/components/PremiumPackList.jsx';
import PremiumWidgetFeature from './premium-modal/components/PremiumWidgetFeature.jsx';
import ReferralOfferBanner from './premium-modal/components/ReferralOfferBanner.jsx';
import { usePremiumCheckout } from './premium-modal/hooks/usePremiumCheckout.js';
import { PACKS } from './premium-modal/premiumPacks.js';

export default function PremiumModal({
    user,
    referralOffer,
    onClose,
    onShowLogin,
    onPurchaseSuccess,
    onReferralOfferConsumed,
}) {
    const checkout = usePremiumCheckout({
        user,
        referralOffer,
        onClose,
        onShowLogin,
        onPurchaseSuccess,
        onReferralOfferConsumed,
    });

    return (
        <PremiumModalShell onClose={onClose}>
            <PremiumModalHeader />
            <ReferralOfferBanner
                offer={checkout.activeReferralOffer}
                offerExpiryLabel={checkout.offerExpiryLabel}
            />
            <PremiumWidgetFeature />
            <PremiumPackList
                activeReferralOffer={checkout.activeReferralOffer}
                packs={PACKS}
                selected={checkout.selected}
                onSelect={checkout.setSelected}
            />
            <PremiumModalActions
                disabled={checkout.loading || checkout.verifying}
                errorMsg={checkout.errorMsg}
                isNative={checkout.isNative}
                onBuy={checkout.handleBuy}
                onClose={onClose}
                onRestore={checkout.handleRestore}
                onShowLogin={onShowLogin}
                purchaseLabel={checkout.purchaseLabel}
            />
        </PremiumModalShell>
    );
}
