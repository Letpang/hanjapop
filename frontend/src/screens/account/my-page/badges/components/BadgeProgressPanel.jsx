import { getBadgeActionText } from '../badgeProgress.js';
import { useLang } from '../../../../../hooks/useLang.js';

const BadgeProgressPanel = ({ badge, progress }) => {
  const { t } = useLang();

  return (
    <div className="rounded-2xl p-4 border flex flex-col gap-2.5 bg-white border-[#E9EDF2] dark:bg-slate-700 dark:border-slate-600">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center gap-3 text-base font-normal tracking-normal">
          <span className="text-[#8D9CAE] dark:text-slate-400">
            {t('ext_2811', { nextLevel: progress.current + 1 })}
          </span>
          <span className="text-[#FF7E8A] whitespace-nowrap">
            {t('ext_2901', { left: progress.leftVal.toLocaleString() })}
          </span>
        </div>
        <p className="text-base font-normal break-keep text-[color:var(--color-text-muted)] dark:text-slate-200">
          {t('ext_1915')} <span className="text-[#6D6FF2] font-normal">{progress.leftVal.toLocaleString()}</span>{getBadgeActionText(badge.id, t)} {t('ext_408')}!
        </p>
      </div>

      <div className="w-full h-2.5 rounded-full overflow-hidden bg-[#F4F7F8] dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-[#FFB433] to-[#FF7E8A] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="mt-3 p-4 rounded-2xl flex flex-col gap-2.5 relative transition-all duration-300 bg-[#F9FAFB] border border-[#F1F5F9] shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:bg-slate-800/60 dark:border dark:border-slate-700 dark:shadow-inner">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-base font-normal px-2.5 py-1 rounded-md tracking-widest bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
            {t('ext_2172')}
          </span>
          <span className="text-base font-normal tracking-normal break-keep text-[#334155] dark:text-white">
            {t(progress.guide.menu)}
          </span>
        </div>
        <p className="text-base font-normal leading-relaxed break-keep text-left text-[#64748B] dark:text-slate-300">
          {t(progress.guide.desc)}
        </p>
      </div>
    </div>
  );
};

export default BadgeProgressPanel;
