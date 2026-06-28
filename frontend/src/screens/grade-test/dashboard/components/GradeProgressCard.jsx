import { BRAND_THEME } from '../gradeDashboardData.js';
import StudyIcon from './StudyIcon.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeProgressCard = ({
  normalizedGrade,
  theme,
  progressPct,
  clearedCount,
  hanjaCount,
  mockPassed,
  onPrimaryClick,
}) => {
  const { t } = useLang();
  const primaryLabel = progressPct === 100 && !mockPassed
    ? t('ext_2579', { normalizedGrade })
    : progressPct > 0 ? t('ext_1663') : t('ext_1772');

  return (
    <section className="shrink-0 rounded-[1.75rem] border border-slate-200/70 dark:border-slate-700 bg-[var(--color-bg-surface)] p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] flex flex-col gap-5 overflow-hidden relative">
      <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full opacity-60" style={{ backgroundColor: theme.bgLight }} />
      <div className="flex justify-between items-start relative">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('ext_1634')}</p>
          <p className="text-[30px] leading-none font-bold text-slate-900 dark:text-white tracking-normal mt-2">
            {progressPct}<span className="text-lg">%</span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {t('ext_2902', { clearedCount, hanjaCount })}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold relative"
          style={{
            backgroundColor: mockPassed ? BRAND_THEME.light : '#F1F5F9',
            color: mockPassed ? BRAND_THEME.deep : '#64748B',
          }}
        >
          <StudyIcon type={mockPassed ? 'check' : 'exam'} className="w-3.5 h-3.5" />
          {mockPassed ? t('ext_1675') : t('ext_1585')}
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%`, backgroundColor: BRAND_THEME.deep }}
          />
        </div>
      </div>

      <button
        onClick={onPrimaryClick}
        className="grade-study-primary-button relative w-full min-h-12 h-auto rounded-2xl px-4 text-white flex items-center justify-between font-semibold text-base"
        style={{ '--grade-start': BRAND_THEME.accent, '--grade-end': BRAND_THEME.deep }}
      >
        <span>{primaryLabel}</span>
        <StudyIcon type="arrow" />
      </button>
    </section>
  );
};

export default GradeProgressCard;
