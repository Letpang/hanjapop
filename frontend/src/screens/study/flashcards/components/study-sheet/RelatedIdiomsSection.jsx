import CollapsibleSection from './CollapsibleSection.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const RelatedIdiomsSection = ({ idioms, isOpen, onToggle }) => {
  const { t } = useLang();
  
  if (idioms.length === 0) return null;

  return (
    <CollapsibleSection title={t('ext_1391')} count={idioms.length} isOpen={isOpen} onToggle={onToggle}>
      {idioms.map((idiom, index) => (
        <div
          key={`${idiom.hanja}-${index}`}
          className="flashcard-word-item flashcard-word-item--col"
        >
          <div className="flashcard-word-item__main-row">
            <div className="flashcard-word-item__hanja hanja-reading-col">
              <span className="flashcard-word-item__word flashcard-word-item__word--idiom hanja-char text-[#4F56D9]">
                {idiom.hanja}
              </span>
              <span className="flashcard-word-item__reading text-[#9AA4B5]">{idiom.reading}</span>
            </div>
            <div className="flashcard-word-item__divider" />
            <div className="flashcard-word-item__meaning py-3">
              <span className="flashcard-word-item__meaning-text break-keep text-[color:var(--color-text-muted)] dark:text-slate-300">
                {idiom.meaning}
              </span>
            </div>
          </div>
          {idiom.origin && (
            <div className="flex items-start gap-2 border-t border-[#E9EDF2] px-4 pb-3 pt-2">
              <span className="flashcard-word-origin-label mt-0.5 shrink-0 rounded border border-[#E2E6EA] bg-[#F2F4F6] px-2 py-1 leading-none text-[#AEB7C5]">
                {t('ext_2325')}
              </span>
              <p className="flashcard-word-origin-text break-keep leading-relaxed text-[#9AA4B5]">{idiom.origin}</p>
            </div>
          )}
        </div>
      ))}
    </CollapsibleSection>
  );
};

export default RelatedIdiomsSection;
