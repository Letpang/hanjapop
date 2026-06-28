import QuizProgressBar from '../../../../../components/QuizProgressBar.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const WritingScreenHeader = ({
  phase,
  onBack,
  activeHanjaList,
  currentIndex,
  startIndex,
  currentAnswered,
  completing,
  characterAvatar,
  selectedCharacter,
}) => {
  const { t } = useLang();

  return (
    <div className="quiz-header-wrap quiz-header-wrap--sm">
      <div className="quiz-header-card quiz-header-card--wide">
        <button onClick={onBack} className="hp-nav-button">
          <span>{phase === 'quiz' ? '✕' : '←'}</span>
        </button>
        <div className="quiz-header-title-area">
          <h2 className="quiz-screen-title">{t('ext_1496')}</h2>
          <p className="screen-subtitle">{t('ext_1899')}</p>
        </div>
        <div className="quiz-header-right">
          {phase === 'quiz' && activeHanjaList.length > 0 && (
            <span className="quiz-counter-text">{currentIndex - startIndex + 1}/{activeHanjaList.length}</span>
          )}
        </div>
      </div>
      {phase === 'quiz' && activeHanjaList.length > 0 && (
        <QuizProgressBar
          current={currentIndex - startIndex}
          total={activeHanjaList.length}
          answered={currentAnswered}
          completing={completing}
          avatar={characterAvatar}
          charType={selectedCharacter}
        />
      )}
    </div>
  );
};

export default WritingScreenHeader;