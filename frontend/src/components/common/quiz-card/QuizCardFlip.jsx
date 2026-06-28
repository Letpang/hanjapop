const getFlipStyle = (isFlipped) => ({
  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  transformStyle: 'preserve-3d',
  WebkitTransformStyle: 'preserve-3d',
});

const QuizCardFlip = ({
  cardAspect,
  cardLayout,
  hasWrong,
  isCorrectSelected,
  isFlipped,
  isSpeaking,
  onCardClick,
  onSpeak,
  renderBack,
  renderFront,
}) => {
  const flipStyle = getFlipStyle(isFlipped);
  const renderArgs = { isAnswered: isCorrectSelected, hasWrong };

  if (cardLayout === 'content') {
    return (
      <div className="w-full card-flip-perspective" onClick={onCardClick}>
        <div style={{ ...flipStyle, transition: 'transform 700ms' }}>
          <div style={{ position: 'relative', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }}>
            {renderFront?.(renderArgs)}
          </div>
          <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isFlipped ? 1 : 0 }}>
            {renderBack?.({ isSpeaking, onSpeak })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`quiz-card-aspect-shell relative w-full ${cardAspect} card-flip-perspective`} onClick={onCardClick}>
      <div className={`quiz-card-flip-shell relative w-full h-full transition-all duration-700 ${isCorrectSelected ? 'cursor-pointer shadow-2xl dark:shadow-slate-900/50' : ''} rounded-[4rem]`} style={flipStyle}>
        <div
          className="quiz-card-front absolute inset-0 flex flex-col items-center justify-center overflow-hidden border-solid"
          style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-bg-surface)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }}
        >
          {renderFront?.(renderArgs)}
        </div>
        {isCorrectSelected && (
          <div className="quiz-card-back dark:bg-slate-800 dark:border-slate-800" style={{ zIndex: isFlipped ? 1 : 0 }}>
            {renderBack?.({ isSpeaking, onSpeak })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCardFlip;
