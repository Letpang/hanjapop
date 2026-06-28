const VocabularyHeader = ({ onBack, title, subtitle }) => (
  <div className="quiz-study-header w-full shrink-0 safe-top pt-1.5 px-3 mb-0">
    <div className="quiz-header-card quiz-header-card--sm">
      <button onClick={onBack} className="hp-nav-button">
        <span>←</span>
      </button>
      <div className="quiz-header-title-area">
        <h2 className="quiz-screen-title">{title}</h2>
        <p className="screen-subtitle">{subtitle}</p>
      </div>
      <div className="quiz-header-right" />
    </div>
  </div>
);

export default VocabularyHeader;
