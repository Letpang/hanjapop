import { useLang } from '../../../hooks/useLang.js';

const DailyFlashcardHeader = ({ currentIndex, total, onBack }) => {
  const { t } = useLang();

  return (
    <div className="quiz-header-card quiz-header-card--wide mb-6">
      <button onClick={onBack} className="hp-nav-button">
        <span>✕</span>
      </button>
      <div className="quiz-header-title-area">
        <h2 className="quiz-screen-title">{t('ext_1494')}</h2>
      </div>
      <div className="quiz-header-right">
        <span className="quiz-counter-text">{currentIndex + 1}/{total}</span>
      </div>
    </div>
  );
};

export default DailyFlashcardHeader;