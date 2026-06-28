import { useLang } from '../../../../../hooks/useLang.js';

const BadgeModalShell = ({ children, onClose }) => {
  const { t } = useLang();

  return (
    <div className="mobile-center-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="mobile-modal-card relative w-full max-w-sm rounded-[2.5rem] p-6 pt-10 pb-8 shadow-2xl flex flex-col gap-5 bg-[#F7FAF9] dark:bg-slate-800"
        onClick={event => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm bg-white text-slate-400 border border-slate-200 dark:bg-slate-700/80 dark:text-slate-300 dark:border dark:border-slate-600"
          aria-label={t('ext_470')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
};

export default BadgeModalShell;