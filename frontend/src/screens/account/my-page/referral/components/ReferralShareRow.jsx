import { useLang } from '../../../../../hooks/useLang.js';

const ReferralShareRow = ({ copied, referralCode, onShare }) => {
  const { t } = useLang();

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[1.25rem] /50 border border-slate-100 dark:border-slate-700 px-3 py-2.5">
        <span className="text-base text-[#8D9CAE]">{t('ext_1569')}</span>
        <strong className="flex-1 min-w-[7rem] text-base text-slate-700 dark:text-slate-100 tracking-wider">
          {referralCode}
        </strong>
        <button
          onClick={onShare}
          className="rounded-full bg-[#7C83FF] px-4 py-2 text-base leading-none font-medium text-white active:scale-95"
        >
          {t('ext_689')}
        </button>
      </div>
      {copied && (
        <p className="mt-2 text-center text-base text-[#00A994]">
          {t('ext_2406')}
        </p>
      )}
    </>
  );
};

export default ReferralShareRow;