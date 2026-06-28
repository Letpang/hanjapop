import { useMemo, useRef, useState } from 'react';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../utils/rankUtils.js';
import { GRADE_BADGE_IMAGES } from './grade-test-result/gradeTestResultData.js';
import GradeTestReportView from './grade-test-result/GradeTestReportView.jsx';
import GradeTestScoreView from './grade-test-result/GradeTestScoreView.jsx';
import { useGradeTestResultShare } from './grade-test-result/useGradeTestResultShare.js';
import { useLang } from '../../hooks/useLang.js';

const GradeTestResult = ({
  passed,
  correct,
  total,
  passCount,
  grade,
  nextGrade,
  alreadyUnlocked,
  selectedCharacter,
  answers = [],
  onRetry,
  onFinish,
}) => {
  const { t } = useLang();
  const [showAnswerReport, setShowAnswerReport] = useState(false);
  const [filter, setFilter] = useState('all');
  const cardRef = useRef(null);

  const percent = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
  const wrongCount = Math.max(0, total - correct);
  const filteredAnswers = useMemo(() => {
    if (filter === 'correct') return answers.filter((answer) => answer.isCorrect);
    if (filter === 'wrong') return answers.filter((answer) => !answer.isCorrect);
    return answers;
  }, [answers, filter]);

  const characterImage = getCharacterImage(selectedCharacter, passed ? 'success' : 'failure');
  const characterStyle = {
    transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, passed ? 'success' : 'failure')})`,
  };
  const badgeImage = GRADE_BADGE_IMAGES[grade];
  const title = passed ? t('ext_2028', { grade }) : t('ext_1792');
  const subtitle = passed
    ? (nextGrade ? t('ext_2520', { nextGrade }) : t('ext_1968'))
    : t('ext_2260');
  const unlockText = t('ext_2029', { grade });
  const share = useGradeTestResultShare({ cardRef, correct, grade, total });

  const resultProps = {
    alreadyUnlocked,
    badgeImage,
    characterImage,
    characterStyle,
    correct,
    passCount,
    passed,
    percent,
    subtitle,
    title,
    total,
    unlockText,
  };

  if (!showAnswerReport) {
    return (
      <GradeTestScoreView
        {...resultProps}
        cardRef={cardRef}
        grade={grade}
        onFinish={onFinish}
        onRetry={onRetry}
        onShare={share.handleShare}
        onShowReport={() => setShowAnswerReport(true)}
        shareStatus={share.shareStatus}
      />
    );
  }

  return (
    <GradeTestReportView
      {...resultProps}
      answers={answers}
      filter={filter}
      filteredAnswers={filteredAnswers}
      nextGrade={nextGrade}
      onBackToScore={() => setShowAnswerReport(false)}
      onFinish={onFinish}
      onRetry={onRetry}
      setFilter={setFilter}
      wrongCount={wrongCount}
    />
  );
};

export default GradeTestResult;