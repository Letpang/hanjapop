const SentenceQuizFrontPrompt = ({ currentQuiz, isAnswered, sentenceParts, sentenceSizeClass }) => (
  <p className={`sentence-quiz-prompt ${sentenceSizeClass} font-normal text-center text-[color:var(--color-text-muted)] dark:text-slate-300/90 break-keep`}>
    {currentQuiz.type === 'sentence' && sentenceParts ? (
      <>
        {sentenceParts.before}
        <span className="inline-block">
          <span
            className={`inline-flex items-center justify-center min-w-[2em] px-2 rounded-2xl transition-all duration-300 mx-1 py-0.5 ${isAnswered
              ? 'bg-[#7C83FF]/10 border-2 border-[#7C83FF] shadow-sm'
              : 'bg-[#F8FAF9] dark:bg-slate-900 border-2 border-dashed border-[#7C83FF]/30 shadow-inner'}`}
            style={{ verticalAlign: 'baseline', minWidth: `${(currentQuiz.target?.word?.length || 1) * 1.5}em` }}
          >
            <span className="sentence-quiz-blank-text font-normal" style={{ color: isAnswered ? '#7C83FF' : '#C3C6FF' }}>
              {isAnswered ? currentQuiz.target.word : '?'}
            </span>
          </span>
          {sentenceParts.particle}
        </span>
        {sentenceParts.remaining}
      </>
    ) : (
      <span className="text-7xl font-normal">{currentQuiz.char}</span>
    )}
  </p>
);

export default SentenceQuizFrontPrompt;
