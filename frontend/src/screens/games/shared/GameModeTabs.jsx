import { useLang } from '../../../hooks/useLang.js';

const GameModeTabs = ({ onViewModeChange, viewMode }) => {
  const { t } = useLang();

  return (
    <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-2 shadow-inner">
      <button
        onClick={() => onViewModeChange('grade')}
        className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'grade' ? 'bg-[var(--color-bg-surface)] shadow-md text-[color:var(--color-text-muted)] dark:text-slate-300' : 'text-[#AEB7C5]'}`}
      >
        {t('ext_2180')}
      </button>
      <button
        onClick={() => onViewModeChange('topic')}
        className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'topic' ? 'bg-[var(--color-bg-surface)] shadow-md text-[color:var(--color-text-muted)] dark:text-slate-300' : 'text-[#AEB7C5]'}`}
      >
        {t('ext_2181')}
      </button>
    </div>
  );
};

export default GameModeTabs;