import StudyIcon from './StudyIcon.jsx';
import VocabularyRow from './VocabularyRow.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeVocabularyView = ({
  normalizedGrade,
  wordTab,
  setWordTab,
  wordSearch,
  setWordSearch,
  gradeWords,
  gradeIdioms,
  filteredVocabulary,
  theme,
  onBack,
}) => {
  const { t } = useLang();
  const vocabularyTabs = [
    { id: 'words', label: t('ext_494') },
    { id: 'idioms', label: t('ext_1391') },
  ];

  return (
    <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
      <header
        className="shrink-0 w-full max-w-2xl mx-auto px-4 pb-3 flex items-center justify-between"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          onClick={onBack}
          aria-label={t('ext_1773')}
          className="w-10 h-10 rounded-full bg-[var(--color-bg-surface)] border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <StudyIcon type="back" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('ext_2411', { normalizedGrade })}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{t('ext_2121')}</p>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] w-full max-w-2xl mx-auto">
        <div className="sticky top-0 z-10 bg-[#F8FAF9]/95 dark:bg-slate-900/95 backdrop-blur-xl pb-3">
          <label className="min-h-12 h-auto px-4 rounded-2xl bg-[var(--color-bg-surface)] border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 shadow-sm">
            <StudyIcon type="search" className="w-5 h-5 text-slate-400" />
            <input
              value={wordSearch}
              onChange={(event) => setWordSearch(event.target.value)}
              placeholder={t('ext_1819')}
              className="w-full bg-transparent outline-none text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </label>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mt-3">
            {vocabularyTabs.map((tab) => {
              const count = tab.id === 'words' ? gradeWords.length : gradeIdioms.length;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setWordTab(tab.id);
                    setWordSearch('');
                  }}
                  className={`rounded-xl py-2.5 text-base font-semibold transition-all ${wordTab === tab.id ? 'bg-[var(--color-bg-surface)] text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  {tab.label} <span className="ml-1 text-sm opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-1 py-2">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {wordTab === 'words' ? t('ext_1504') : t('ext_1635')}
          </p>
          <p className="text-sm text-slate-400">{t('ext_2629', { count: filteredVocabulary.length })}</p>
        </div>
        <div className="flex flex-col gap-2">
          {filteredVocabulary.length ? (
            filteredVocabulary.map((item, index) => (
              <VocabularyRow
                key={item.id ?? `${item.word ?? item.hanja}-${index}`}
                item={item}
                index={index}
                isIdiom={wordTab === 'idioms'}
                theme={theme}
              />
            ))
          ) : (
            <p className="text-center text-sm text-slate-400 py-16">{t('ext_1869')}</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default GradeVocabularyView;
