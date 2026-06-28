import CollapsibleSection from './CollapsibleSection.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const getWordSizeClass = (word) => {
  if (word.length <= 2) return 'flashcard-word-item__word--short';
  if (word.length === 3) return 'flashcard-word-item__word--medium';
  return 'flashcard-word-item__word--long';
};

const RelatedWordsSection = ({ words, isOpen, onToggle }) => {
  const { t } = useLang();

  if (words.length === 0) return null;

  return (
    <CollapsibleSection title={t('ext_1538')} count={words.length} isOpen={isOpen} onToggle={onToggle}>
      {words.map((word, index) => (
        <div key={`${word.word}-${index}`} className="flashcard-word-item">
          <div className="flashcard-word-item__hanja hanja-reading-col">
            <span className={`flashcard-word-item__word hanja-char text-[#4F56D9] ${getWordSizeClass(word.word)}`}>
              {word.word}
            </span>
            <span className="flashcard-word-item__reading text-[#9AA4B5]">
              {word.reading}
            </span>
          </div>
          <div className="flashcard-word-item__divider" />
          <div className="flashcard-word-item__meaning">
            <span className="flashcard-word-item__meaning-text break-keep text-[color:var(--color-text-muted)] dark:text-slate-300">
              {word.meaning}
            </span>
          </div>
        </div>
      ))}
    </CollapsibleSection>
  );
};

export default RelatedWordsSection;
