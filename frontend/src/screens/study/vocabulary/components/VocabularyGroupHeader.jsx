import { useLang } from '../../../../hooks/useLang.js';

const VocabularyGroupHeader = ({ day, fallbackLabel }) => {
  const { t } = useLang();
  
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="shrink-0 rounded-full bg-[#EEF0FF] px-2.5 py-0.5 text-base font-medium text-[#7C83FF] dark:bg-indigo-950/40 dark:text-indigo-300">
        {day === 'other' ? fallbackLabel : t('ext_1687', { day })}
      </span>
      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700/60" />
    </div>
  );
};

export default VocabularyGroupHeader;