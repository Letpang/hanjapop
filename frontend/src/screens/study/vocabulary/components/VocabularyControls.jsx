import { FILTERS, TABS } from '../vocabularyUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const VocabularyControls = ({
  tab,
  onTabChange,
  filter,
  onFilterChange,
  query,
  onQueryChange,
}) => {
  const { lang, t } = useLang();
  const getTabLabel = (item) => {
    if (item.id === 'idioms' && lang === 'en') return 'Idioms';
    return t(item.label);
  };

  return (
    <>
      <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F4F6F8] p-1 dark:bg-slate-900">
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`vocabulary-tab-button rounded-xl px-2 py-2.5 font-semibold transition-all ${
              tab === item.id
                ? 'bg-white text-[#334155] shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-[#8D9CAE] dark:text-slate-400'
            }`}
          >
            {getTabLabel(item)}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder={t('ext_918')}
        className="mb-3 w-full rounded-2xl border border-slate-100 bg-[#F8FAF9] px-4 py-3.5 text-[1.05rem] font-normal text-[#334155] outline-none placeholder:text-[#AEB7C5] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(item => (
          <button
            key={item.id}
            onClick={() => onFilterChange(item.id)}
            className={`shrink-0 rounded-full px-5 py-2 text-base font-medium transition-all ${
              filter === item.id
                ? 'bg-[#334155] text-white dark:bg-slate-600'
                : 'bg-[#F4F6F8] text-[#7A8798] dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            {t(item.label)}
          </button>
        ))}
      </div>
    </>
  );
};

export default VocabularyControls;
