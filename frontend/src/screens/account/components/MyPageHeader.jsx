import { useLang } from '../../../hooks/useLang.js';

const MyPageHeader = ({ onBack, onSettings }) => {
  const { t } = useLang();

  return (
    <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
      <div className="quiz-header-card quiz-header-card--wide">
        <button
          onClick={onBack}
          aria-label={t('ext_1485')}
          className="flex items-center justify-center bg-white/90 dark:bg-slate-700 border-2 border-[var(--color-border-subtle)] rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-normal text-[color:var(--color-text-muted)] dark:text-slate-200 gap-1"
        >
          ←
        </button>
        <div className="flex items-center gap-2 overflow-hidden">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-100 m-0">{t('ext_1566')}</h2>
        </div>
        <button
          onClick={onSettings}
          aria-label={t('ext_1486')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all bg-white text-[#AEB7C5] border border-slate-100 shadow-[0_4px_12px_rgba(80,96,120,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:shadow-[0_8px_18px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            className="w-5 h-5">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MyPageHeader;