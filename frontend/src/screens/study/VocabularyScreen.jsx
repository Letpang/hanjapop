import { useMemo, useState } from 'react';
import VocabularyControls from './vocabulary/components/VocabularyControls.jsx';
import VocabularyHeader from './vocabulary/components/VocabularyHeader.jsx';
import VocabularyListPanel from './vocabulary/components/VocabularyListPanel.jsx';
import VocabularyStats from './vocabulary/components/VocabularyStats.jsx';
import {
  collectVocabulary,
  filterHanjas,
  filterIdioms,
  filterWords,
  groupByDay,
} from './vocabulary/vocabularyUtils.js';
import { useLang } from '../../hooks/useLang.js';

const VocabularyScreen = ({
  onBack,
  initialFilter = 'all',
  initialTab = 'words',
  title,
  subtitle,
}) => {
  const { t } = useLang();
  const { words, hanjas, idioms } = useMemo(() => collectVocabulary(t), [t]);
  const [tab, setTab] = useState(initialTab);
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredWords = useMemo(
    () => filterWords(words, filter, normalizedQuery),
    [words, filter, normalizedQuery],
  );
  const filteredHanjas = useMemo(
    () => filterHanjas(hanjas, filter, normalizedQuery),
    [hanjas, filter, normalizedQuery],
  );
  const filteredIdioms = useMemo(
    () => filterIdioms(idioms, filter, normalizedQuery),
    [idioms, filter, normalizedQuery],
  );

  const groupedWords = useMemo(() => groupByDay(filteredWords), [filteredWords]);
  const groupedHanjas = useMemo(() => groupByDay(filteredHanjas), [filteredHanjas]);
  const groupedIdioms = useMemo(() => groupByDay(filteredIdioms), [filteredIdioms]);

  const wrongCount = words.filter(w => w.wrongCount > 0).length;
  const idiomWrongCount = idioms.filter(w => w.wrongCount > 0).length;
  const hanjaWrongCount = hanjas.filter(h => h.wrongCount > 0).length;
  const totalCount = words.length + idioms.length + hanjas.length;
  const correctCount = totalCount - wrongCount - idiomWrongCount - hanjaWrongCount;

  return (
    <div className="vocabulary-screen fixed inset-0 z-50 overflow-y-auto">
      <div className="safe-top safe-bottom mx-auto flex min-h-screen w-full max-w-lg flex-col gap-5 px-5 pt-4">
        <VocabularyHeader onBack={onBack} title={title ?? t('ext_971')} subtitle={subtitle ?? t('ext_2145')} />
        <VocabularyStats
          totalCount={totalCount}
          wrongCount={wrongCount + idiomWrongCount + hanjaWrongCount}
          correctCount={correctCount}
        />

        <section className="premium-panel p-4">
          <VocabularyControls
            tab={tab}
            onTabChange={setTab}
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            onQueryChange={setQuery}
          />
          <VocabularyListPanel
            tab={tab}
            groupedWords={groupedWords}
            filteredWords={filteredWords}
            groupedHanjas={groupedHanjas}
            filteredHanjas={filteredHanjas}
            groupedIdioms={groupedIdioms}
            filteredIdioms={filteredIdioms}
          />
        </section>
      </div>
    </div>
  );
};

export default VocabularyScreen;
