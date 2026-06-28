import VocabularyHanjaList from './VocabularyHanjaList.jsx';
import VocabularyIdiomList from './VocabularyIdiomList.jsx';
import VocabularyWordList from './VocabularyWordList.jsx';

const VocabularyListPanel = ({
  tab,
  groupedWords,
  filteredWords,
  groupedHanjas,
  filteredHanjas,
  groupedIdioms,
  filteredIdioms,
}) => {
  if (tab === 'hanja') {
    return <VocabularyHanjaList groups={groupedHanjas} totalCount={filteredHanjas.length} />;
  }

  if (tab === 'idioms') {
    return <VocabularyIdiomList groups={groupedIdioms} totalCount={filteredIdioms.length} />;
  }

  return <VocabularyWordList groups={groupedWords} totalCount={filteredWords.length} />;
};

export default VocabularyListPanel;
