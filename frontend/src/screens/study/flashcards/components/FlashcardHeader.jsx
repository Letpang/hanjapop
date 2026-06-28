import QuizProgressBar from '../../../../components/QuizProgressBar.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const FlashcardHeader = ({
  characterAvatar,
  completing,
  currentIndex,
  currentItems,
  inSequenceMode,
  onBack,
  onRequestExit,
  selectedCharacter,
  shouldShowProgress,
}) => {
  const { t } = useLang();

  return (
    <div className="w-full shrink-0 safe-top pt-2 px-4 mb-3">
      <div className="quiz-header-card quiz-header-card--sm">
        <button
          onClick={shouldShowProgress ? onRequestExit : onBack}
          className="hp-nav-button"
        >
          <span>{shouldShowProgress ? '✕' : '←'}</span>
        </button>
        <div className="quiz-header-title-area">
          <h2 className="quiz-screen-title">{t('ext_1057')}</h2>
          <p className="screen-subtitle">{t('ext_2088')}</p>
        </div>
        <div className="quiz-header-right">
          {shouldShowProgress && (
            <span className="quiz-counter-text">
              {inSequenceMode ? `${currentIndex + 1}/${currentItems.length}` : '1/1'}
            </span>
          )}
        </div>
      </div>
      {shouldShowProgress && (
        <QuizProgressBar
          current={inSequenceMode ? currentIndex : currentItems.length}
          total={currentItems.length}
          completing={completing}
          avatar={characterAvatar}
          charType={selectedCharacter}
        />
      )}
    </div>
  );
};

export default FlashcardHeader;
