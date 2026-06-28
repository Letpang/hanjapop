import { useLang } from '../../../../../hooks/useLang.js';

const ReferralRewardStatus = ({ activeOffer, fullpackGranted, offerExpiryLabel }) => {
  const { t } = useLang();

  if (fullpackGranted) {
    return (
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[1.25rem] bg-[#F0FEFA] dark:bg-teal-950/20 border border-[#B8F0E8] dark:border-teal-900/40 px-3 py-2.5">
        <span className="text-base text-[#00A994]">{t('ext_1568')}</span>
        <strong className="text-base text-slate-700 dark:text-slate-100">{t('ext_1986')}</strong>
      </div>
    );
  }

  if (!activeOffer) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[1.25rem] bg-[#EEF2FF] dark:bg-indigo-950/20 border border-[#D8D4FF] dark:border-indigo-900/40 px-3 py-2.5">
      <span className="text-base text-[#7C83FF]">{t('ext_1812')}</span>
      <strong className="text-base text-slate-700 dark:text-slate-100">
        {t('ext_3046', {
          discountPercent: activeOffer.discount_percent,
          offerExpiryLabel,
        })}
      </strong>
    </div>
  );
};

export default ReferralRewardStatus;
