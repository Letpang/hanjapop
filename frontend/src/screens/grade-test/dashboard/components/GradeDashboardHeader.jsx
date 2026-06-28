import { BRAND_THEME } from '../gradeDashboardData.js';
import StudyIcon from './StudyIcon.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeDashboardHeader = ({ normalizedGrade, isUnlocked, onBack }) => {
  const { t } = useLang();

  return (
    <header
      className="shrink-0 w-full max-w-2xl mx-auto px-4 pb-3 flex items-center justify-between z-30"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <button
        onClick={onBack}
        aria-label={t('ext_1485')}
        className="w-10 h-10 rounded-full bg-[var(--color-bg-surface)] border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
      >
        <StudyIcon type="back" />
      </button>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-normal">
        {t('ext_2628', { normalizedGrade })}
      </h1>
      <span
        className="min-w-10 text-right text-sm font-semibold"
        style={{ color: isUnlocked ? BRAND_THEME.deep : '#94A3B8' }}
      >
        {isUnlocked ? t('ext_1503') : t('ext_493')}
      </span>
    </header>
  );
};

export default GradeDashboardHeader;
