import { useLang } from '../../../hooks/useLang.js';

const ReferralOfferBanner = ({ offer, offerExpiryLabel }) => {
    const { t } = useLang();

    if (!offer?.eligible) return null;

    const discountPercent = offer.discount_percent || 20;

    return (
        <div className="px-5 mb-4">
            <div className="rounded-2xl border border-[#FFE0D4] bg-[#FFF7F3] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-base font-medium text-[#E8664F]">{t('ext_1903')}</div>
                    <div className="text-base font-normal text-slate-500 mt-0.5 break-keep">
                        {t('ext_1071')} {discountPercent}% {t('ext_73')} · {offerExpiryLabel}
                    </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#FF9B73] px-3 py-1 text-base font-medium text-white">
                    -{discountPercent}%
                </span>
            </div>
        </div>
    );
};

export default ReferralOfferBanner;
