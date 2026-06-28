import StarBurst from './StarBurst.jsx';
import { useLang } from '../../../hooks/useLang.js';
import { getChoiceTextSizeClass } from './choiceTextSizing.js';

const QuizChoiceGrid = ({
  celebrationMsg,
  choiceClassName,
  choiceGridClassName,
  choiceGridStyle,
  choices,
  correctAnswer,
  isCorrectSelected,
  onSelect,
  renderChoice,
  wrongChoices,
}) => {
  const { t } = useLang();
  const gridClass = choiceGridClassName !== undefined ? choiceGridClassName : 'quiz-choice-grid';

  return (
    <div className={gridClass} style={choiceGridStyle}>
      {(() => {
        const maxLen = Math.max(...choices.map(c => {
          if (typeof c !== 'string') return 0;
          return c.replace(/\s+/g, '').length;
        }));
        const textSizeClass = maxLen >= 6
          ? 'quiz-choice-btn--text-long'
          : maxLen >= 4
          ? 'quiz-choice-btn--text-medium'
          : '';

        return choices.map((choice, i) => {
          const isWrong = wrongChoices.includes(choice);
          const isCorrect = isCorrectSelected && choice === correctAnswer;
          const isDimmed = isCorrectSelected && !isCorrect;
          return (
            <button
              key={i}
              onClick={() => onSelect(choice)}
              disabled={isCorrectSelected}
              className={`quiz-choice-btn ${choiceClassName} ${textSizeClass} ${isCorrect ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : isDimmed ? 'quiz-choice-btn--dimmed' : ''}`}
            >
              {renderChoice
                ? renderChoice(choice, { isCorrect, isWrong, isDimmed })
                : <span>{choice}</span>
              }
              {isCorrect && celebrationMsg && (
                <div
                  className="absolute bottom-[125%] left-1/2 -translate-x-1/2 max-w-[min(85vw,22rem)] px-5 py-2.5 rounded-[1.3rem] text-white font-normal text-[1.05rem] text-center leading-tight shadow-xl flex items-center justify-center z-[20] pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg,#FF9B73 0%,#FF6B6B 100%)',
                    boxShadow: '0 8px 24px rgba(255,107,107,.3),inset 0 -3px 0 rgba(0,0,0,.15)',
                    animation: 'pop-bubble .4s cubic-bezier(.175,.885,.32,1.275) forwards,fade-out-up .3s ease-in 1.2s forwards',
                  }}
                >
                  <span className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,.15)]">{t(celebrationMsg)}</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#FF6B6B]" />
                </div>
              )}
              {isCorrect && <StarBurst />}
            </button>
          );
        });
      })()}
    </div>
  );
};

export default QuizChoiceGrid;
