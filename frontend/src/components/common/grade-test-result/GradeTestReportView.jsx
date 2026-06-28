import CtaButton from '../CtaButton.jsx';
import GradeTestAnswerReview from './GradeTestAnswerReview.jsx';
import { useLang } from '../../../hooks/useLang.js';

const GradeTestReportView = ({
  alreadyUnlocked,
  answers,
  badgeImage,
  characterImage,
  characterStyle,
  correct,
  filter,
  filteredAnswers,
  nextGrade,
  onBackToScore,
  onFinish,
  onRetry,
  passCount,
  passed,
  percent,
  setFilter,
  subtitle,
  title,
  total,
  unlockText,
  wrongCount,
}) => {
  const { t } = useLang();

  return (
    <div className={`grade-test-report-screen dark:bg-slate-900 ${passed ? 'grade-test-report-screen--pass' : 'grade-test-report-screen--fail'}`}>
      <main className="grade-test-report-shell">
        <button className="grade-test-report-back" onClick={onBackToScore}>{t('ext_2658')}</button>
        <section className="grade-test-report-hero">
          <img
            src={characterImage}
            alt=""
            className="grade-test-report-character"
            style={characterStyle}
          />
          <div className="grade-test-report-heading">
            <span className={`grade-test-report-status ${passed ? 'is-pass' : 'is-fail'}`}>{passed ? t('ext_278') : t('ext_939')}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="grade-test-report-score">
            <strong>{correct}</strong><span>/{total}</span>
            <small>{t('ext_1744', { percent })}</small>
          </div>
        </section>

        <section className="grade-test-report-summary">
          <div><span>{t('ext_275')}</span><strong className="is-correct">{correct}</strong></div>
          <div><span>{t('ext_277')}</span><strong className="is-wrong">{wrongCount}</strong></div>
          <div><span>{t('ext_1478')}</span><strong>{passCount}</strong></div>
        </section>

        {passed && !alreadyUnlocked && (
          <section className="grade-test-report-unlock">
            {badgeImage && <img src={badgeImage} alt="" />}
            <div><strong>{unlockText}</strong><span>{nextGrade ? t('ext_2330', { nextGrade }) : t('ext_1968')}</span></div>
          </section>
        )}

        <GradeTestAnswerReview
          answers={answers}
          correct={correct}
          filter={filter}
          filteredAnswers={filteredAnswers}
          setFilter={setFilter}
          wrongCount={wrongCount}
        />

        <div className="grade-test-report-actions">
          <button onClick={onRetry} className="grade-test-report-retry">{t('ext_1553')}</button>
          <CtaButton onClick={onFinish} theme={passed ? 'indigo' : 'coral'}>{passed ? t('ext_276') : t('ext_1068')}</CtaButton>
        </div>
      </main>
    </div>
  );
};

export default GradeTestReportView;