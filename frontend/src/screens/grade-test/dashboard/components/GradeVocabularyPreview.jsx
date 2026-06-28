import { BRAND_THEME } from '../gradeDashboardData.js';
import StudyIcon from './StudyIcon.jsx';
import VocabularyRow from './VocabularyRow.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeVocabularyPreview = ({
  normalizedGrade,
  gradeWords,
  gradeIdioms,
  theme,
  onOpenVocabulary,
}) => {
  const { t } = useLang();

  return (
    <section className="shrink-0 flex flex-col gap-3">
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-normal">{t('ext_971')}</h2>
          <p className="text-base text-slate-400 mt-1">
            {normalizedGrade} {t('ext_494')} {gradeWords.length} · {t('ext_1391')} {gradeIdioms.length}
          </p>
        </div>
        <span className="text-base font-semibold" style={{ color: BRAND_THEME.deep }}>
          {t('ext_281')} {gradeWords.length + gradeIdioms.length} {t('ext_231')}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {gradeWords.slice(0, 2).map((word, index) => (
          <VocabularyRow key={word.id ?? `${word.word}-${index}`} item={word} index={index} theme={theme} />
        ))}
      </div>

      <button
        onClick={onOpenVocabulary}
        className="grade-study-primary-button min-h-12 h-auto rounded-2xl px-4 text-white flex items-center justify-between font-semibold text-base"
        style={{ '--grade-start': BRAND_THEME.accent, '--grade-end': BRAND_THEME.deep }}
      >
        <span>{t('ext_1712')}</span>
        <span className="flex items-center gap-2 text-base font-medium opacity-90">
          {gradeWords.length + gradeIdioms.length} {t('ext_231')} <StudyIcon type="arrow" className="w-4 h-4" />
        </span>
      </button>
    </section>
  );
};

export default GradeVocabularyPreview;