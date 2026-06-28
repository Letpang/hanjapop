import { useLang } from '../../../../../hooks/useLang.js';

const GradeBadgeNextPanel = ({ isComplete, nextBadge }) => {
  const { t } = useLang();

  return (
    <div className="rounded-2xl p-4 border flex flex-col gap-1.5 bg-white border-[#E9EDF2] dark:bg-slate-700 dark:border-slate-600">
      {isComplete ? (
        <p className="text-base font-normal text-center break-keep text-amber-700 dark:text-amber-300">
          {t('ext_2576')}
        </p>
      ) : (
        <>
          <p className="text-base font-normal tracking-normal text-[#8D9CAE] dark:text-slate-400">
            {t('ext_279')}
          </p>
          <p className="text-base font-normal break-keep text-[color:var(--color-text-muted)] dark:text-slate-200">
            <span className="text-[#6D6FF2] font-normal">{nextBadge.label} {t('ext_586')}</span>{t('ext_2174')}
          </p>
        </>
      )}
    </div>
  );
};

export default GradeBadgeNextPanel;