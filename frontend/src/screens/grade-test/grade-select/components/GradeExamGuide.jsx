import { useLang } from '../../../../hooks/useLang.js';

const GradeExamGuide = () => {
  const { t } = useLang();

  return (
    <section className="grade-exam-guide" aria-label={t('ext_1774')}>
      <span className="grade-exam-guide-mark" aria-hidden="true">級</span>
      <span className="grade-exam-guide-copy">
        <strong>{t('ext_1713')}</strong>
        <small>{t('ext_1505')}</small>
      </span>
    </section>
  );
};

export default GradeExamGuide;