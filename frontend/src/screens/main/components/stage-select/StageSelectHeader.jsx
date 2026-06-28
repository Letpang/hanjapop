import { useLang } from '../../../../hooks/useLang.js';

const StageSelectHeader = ({ onClose }) => {
  const { t } = useLang();

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[19px] font-medium tracking-normal text-slate-800 dark:text-slate-100">{t('ext_478')}</h3>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export default StageSelectHeader;