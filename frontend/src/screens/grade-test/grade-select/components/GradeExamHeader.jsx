import { useLang } from '../../../../hooks/useLang.js';

const GradeExamHeader = ({ onBack }) => {
  const { t } = useLang();

  return (
    <div className="grade-exam-select-header-wrap">
      <header className="grade-exam-select-header">
        <button onClick={onBack} className="hp-nav-button grade-exam-back-button" aria-label={t('ext_1485')}>
          <span aria-hidden="true" className="grade-exam-chevron grade-exam-chevron--left" />
        </button>
        <div className="grade-exam-title-block">
          <h2 className="grade-exam-title">{t('ext_1677')}</h2>
          <p className="grade-exam-subtitle">{t('ext_2189')}</p>
        </div>
        <div className="grade-exam-header-spacer" />
      </header>
    </div>
  );
};

export default GradeExamHeader;
