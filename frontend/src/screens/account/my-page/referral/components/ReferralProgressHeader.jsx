import { useLang } from '../../../../../hooks/useLang.js';

const ReferralProgressHeader = ({ count, subtitle }) => {
  const { t } = useLang();

  return (
    <div className="px-5 pt-4 pb-3 border-b border-[#E5EAF2] dark:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-base tracking-normal text-[#3C3C3C] dark:text-slate-100">
            {t('ext_912')} {t('ext_2313')}
          </h3>
          <p className="mt-1 text-base leading-snug font-normal text-[#8D9CAE] dark:text-slate-400 break-keep">
            {subtitle}
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-[#E8FAF7] px-3 py-1 text-base font-medium text-[#00A994]">
          {t('ext_2405', { count })}
        </div>
      </div>
    </div>
  );
};

export default ReferralProgressHeader;
