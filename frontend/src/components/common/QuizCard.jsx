import QuizCardFlip from './quiz-card/QuizCardFlip.jsx';
import QuizCardNav from './quiz-card/QuizCardNav.jsx';
import QuizCardXpPopup from './quiz-card/QuizCardXpPopup.jsx';
import QuizChoiceGrid from './quiz-card/QuizChoiceGrid.jsx';
import SpeakButton from './quiz-card/SpeakButton.jsx';
import { useQuizCardState } from './quiz-card/useQuizCardState.js';

export { SpeakButton };

const QuizCard = ({
  renderFront,
  renderBack,
  choices = [],
  correctAnswer,
  choiceGridClassName,
  choiceGridStyle,
  choiceClassName = '',
  renderChoice,
  cardAspect = 'aspect-[9/5] sm:aspect-[16/9]',
  cardLayout = 'aspect',
  isFirst = true,
  isLast = false,
  completing = false,
  speakText = '',
  xpAmount = 5,
  suppressXp = false,
  combo = 0,
  onCorrect,
  onWrong,
  onNext,
  onPrev,
  onCorrectSelected,
}) => {
  const {
    cardState,
    handleCardClick,
    handleNext,
    handleSelect,
    speak,
  } = useQuizCardState({
    combo,
    correctAnswer,
    onCorrect,
    onCorrectSelected,
    onNext,
    onWrong,
    speakText,
    suppressXp,
  });

  return (
    <div className={`quiz-card-layout quiz-card-layout--${cardLayout} flex-1 min-h-0 flex flex-col gap-3 w-full max-w-2xl mx-auto animate-in fade-in duration-500`}>
      <QuizCardXpPopup
        combo={combo}
        show={cardState.showXPPopup}
        xpAmount={xpAmount}
        xpAnimKey={cardState.xpAnimKey}
      />

      <div className={`quiz-card-main-stack flex-1 min-h-0 flex flex-col w-full animate-in slide-in-from-bottom-6 duration-400 ${completing ? 'pointer-events-none' : ''}`}>
        <QuizCardFlip
          cardAspect={cardAspect}
          cardLayout={cardLayout}
          hasWrong={cardState.wrongChoices.length > 0}
          isCorrectSelected={cardState.isCorrectSelected}
          isFlipped={cardState.isFlipped}
          isSpeaking={cardState.isSpeaking}
          onCardClick={handleCardClick}
          onSpeak={speak}
          renderBack={renderBack}
          renderFront={renderFront}
        />

        <QuizChoiceGrid
          celebrationMsg={cardState.celebrationMsg}
          choiceClassName={choiceClassName}
          choiceGridClassName={choiceGridClassName}
          choiceGridStyle={choiceGridStyle}
          choices={choices}
          correctAnswer={correctAnswer}
          isCorrectSelected={cardState.isCorrectSelected}
          onSelect={handleSelect}
          renderChoice={renderChoice}
          wrongChoices={cardState.wrongChoices}
        />

        <QuizCardNav
          completing={completing}
          isCorrectSelected={cardState.isCorrectSelected}
          isFirst={isFirst}
          isLast={isLast}
          onNext={handleNext}
          onPrev={onPrev}
        />
      </div>
    </div>
  );
};

export default QuizCard;
