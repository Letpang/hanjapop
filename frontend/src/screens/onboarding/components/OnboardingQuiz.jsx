import { PROMPT, TOTAL } from '../onboardingData.js';
import { useLang } from '../../../hooks/useLang.js';

const renderSentence = (sentence) => {
  const parts = sentence.split('___');
  return (
    <p className="text-center font-bold text-[#2c3e50] dark:text-slate-100 break-keep"
      style={{ fontSize: 'clamp(1.55rem, 6.5vw, 1.85rem)', lineHeight: 1.5 }}>
      {parts[0]}
      <span
        className="inline-block align-middle mx-1 border-b-[3px] border-[#7C83FF] text-[#7C83FF]"
        style={{ minWidth: '60px', height: '1em' }}
      />
      {parts[1]}
    </p>
  );
};

const OnboardingQuiz = ({ question, index, selected, isCorrect, onSelect }) => {
  const { t } = useLang();
  const answered = selected != null;

  return (
    <div className="onboarding-activity-screen flex min-h-[100dvh] w-full flex-col overflow-y-auto  px-5 py-6 safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="quiz-progress-track flex-1">
            <div className="quiz-progress-fill bg-[#00C7AE]" style={{ width: `${((index + 1) / TOTAL) * 100}%` }} />
          </div>
          <span className="quiz-counter-text shrink-0">{index + 1}/{TOTAL}</span>
        </div>

        <div className="grade-test-question-card">
          <div className="flex items-center justify-between w-full">
            <span className="rounded-full bg-[#E8FAF7] px-3 py-1 text-base font-normal text-[#00A994]">{question.grade}</span>
            <span className="grade-test-type-label">{t(question.skill)}</span>
          </div>

          {question.type === 'sentence' ? (
            <>
              <p className="text-center text-base font-medium text-[#888] dark:text-slate-400 mb-1">{t(PROMPT[question.type])}</p>
              <div className="flex flex-col items-center gap-4 py-1">
                {renderSentence(question.sentence)}
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#F4F6FF] dark:bg-slate-700 px-6 py-3">
                  <span className="text-[#7C83FF] font-medium text-[18px]">{question.hanja}</span>
                  <span className="text-base font-normal text-[#A0A0A0] dark:text-slate-400">{question.hint}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`grade-test-hanja-box ${question.hanja.length > 1 ? 'grade-test-hanja-box--compound' : 'grade-test-hanja-box--single'}`}>
                <span className="grade-test-hanja-char hanja-char">{question.hanja}</span>
              </div>
              <p className="text-center font-medium text-[#334155] dark:text-slate-200 text-[clamp(1.45rem,6vw,1.85rem)]">{t(PROMPT[question.type])}</p>
              <p className="text-center text-lg font-normal text-[#9AA6B8] dark:text-slate-400">{question.hint}</p>
            </>
          )}
        </div>

        <div className="quiz-choice-grid !mt-0">
          {question.options.map(option => {
            const right = answered && option === question.answer;
            const wrong = answered && option === selected && option !== question.answer;
            const dimmed = answered && !right;
            return (
              <button
                key={option}
                onClick={() => onSelect(option)}
                disabled={answered}
                className={`quiz-choice-btn ${right ? 'quiz-choice-btn--correct' : wrong ? 'quiz-choice-btn--wrong' : dimmed ? 'quiz-choice-btn--dimmed' : ''}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`rounded-[1.5rem] px-4 py-3 text-center text-base font-normal ${isCorrect ? 'bg-[#E8FAF7] text-[#00A994]' : 'bg-[#FFF1EE] text-[#E8664F]'}`}>
            {isCorrect ? t('ext_2085') : t('ext_2694', { answer: question.answer })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingQuiz;