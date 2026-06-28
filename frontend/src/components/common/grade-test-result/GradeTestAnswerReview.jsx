import { cleanSentence } from './gradeTestResultData.js';
import { useLang } from '../../../hooks/useLang.js';

const GradeTestAnswerReview = ({
  answers,
  correct,
  filter,
  filteredAnswers,
  setFilter,
  wrongCount,
}) => {
  const { t } = useLang();

  return (
    <section className="grade-test-report-review">
      <div className="grade-test-report-review-head">
        <div><span>{t('ext_1552')}</span><small>{t('ext_2030')}</small></div>
        <strong>{t('ext_2521', { count: filteredAnswers.length })}</strong>
      </div>
      <div className="grade-test-report-tabs">
        <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>{t('ext_281')} {answers.length}</button>
        <button className={filter === 'wrong' ? 'is-active' : ''} onClick={() => setFilter('wrong')}>{t('ext_277')} {wrongCount}</button>
        <button className={filter === 'correct' ? 'is-active' : ''} onClick={() => setFilter('correct')}>{t('ext_275')} {correct}</button>
      </div>
      <div className="grade-test-report-list">
        {filteredAnswers.map((answer) => (
          <article key={answer.number} className={`grade-test-report-item ${answer.isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <header>
              <span>#{answer.number}</span>
              <em>{answer.type}</em>
              <strong>{answer.isCorrect ? t('ext_275') : t('ext_277')}</strong>
            </header>
            <p className="grade-test-report-question">{answer.prompt}</p>
            {answer.sentence && <p className="grade-test-report-sentence">{cleanSentence(answer.sentence)}</p>}
            <div className="grade-test-report-answer-row">
              <div><span>{t('ext_938')}</span><strong>{answer.userAnswer}</strong></div>
              {!answer.isCorrect && <div><span>{t('ext_108')}</span><strong>{answer.correctAnswer}</strong></div>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default GradeTestAnswerReview;
