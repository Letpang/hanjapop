import LevelTestXpPopup from './LevelTestXpPopup.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const getChoiceStateClass = ({ choice, revealed, selected, answer }) => {
  if (!revealed) {
    if (selected !== null && choice === selected) return 'quiz-choice-btn--wrong';
    if (selected !== null) return 'quiz-choice-btn--dimmed';
    return '';
  }

  if (choice === answer) return 'quiz-choice-btn--correct';
  if (choice === selected) return 'quiz-choice-btn--wrong';
  return 'quiz-choice-btn--dimmed';
};

const LevelTestQuiz = ({
  xpPopup,
  question,
  qIndex,
  questions,
  progress,
  isHanjaDisplay,
  selected,
  revealed,
  onBackToIntro,
  onSelect,
  onNext,
}) => {
  const { t } = useLang();

  if (!question) return null;

  return (
    <div className="quiz-screen">
      <LevelTestXpPopup popup={xpPopup} />

      <div className="quiz-header-wrap">
        <div className="quiz-header-card">
          <button
            onClick={onBackToIntro}
            className="flex shrink-0 items-center justify-center gap-1 rounded-2xl border-2 border-white bg-white px-3 py-1.5 text-sm font-normal text-[color:var(--color-text-muted)] shadow-sm transition-all active:scale-95 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300"
          >
            <span>←</span>
          </button>
          <div className="flex-1">
            <div className="quiz-progress-row">
              <span>{t('ext_1592')}</span>
              <span>{qIndex + 1} / {questions.length}</span>
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill"
                style={{ width: `${progress}%`, backgroundColor: '#6D6FF2' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="quiz-content-area">
        <div className="quiz-content-inner">
          <div className="grade-test-question-card">
            <p className="grade-test-prompt">{t(question.prompt)}</p>
            <div className={`grade-test-hanja-box ${isHanjaDisplay ? 'grade-test-hanja-box--single' : 'grade-test-hanja-box--compound'}`}>
              <span className="grade-test-hanja-char hanja-char">{question.hanja}</span>
            </div>
          </div>

          <div className="grade-test-choice-grid">
            {question.choices.map((choice, index) => (
              <button
                key={`${choice}-${index}`}
                onClick={() => onSelect(choice)}
                className={`quiz-choice-btn ${getChoiceStateClass({ choice, revealed, selected, answer: question.answer })}`}
              >
                <span className="break-keep">{choice}</span>
              </button>
            ))}
          </div>

          {revealed && (
            <div className={`quiz-feedback ${selected === question.answer ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`}>
              {selected === question.answer ? t('ext_994') : t('ext_2412', { answer: question.answer })}
            </div>
          )}

          {revealed && (
            <button onClick={onNext} className="quiz-next-btn w-full">
              {qIndex + 1 >= questions.length ? t('ext_1479') : t('ext_1467')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelTestQuiz;