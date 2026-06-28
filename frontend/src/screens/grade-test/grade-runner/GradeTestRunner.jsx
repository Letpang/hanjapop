import { useMemo } from 'react';
import GradeTestIntro from '../../../components/common/GradeTestIntro.jsx';
import GradeTestResult from '../../../components/common/GradeTestResult.jsx';
import GradeTestQuizView from './components/GradeTestQuizView.jsx';
import { useGradeTestRunner } from './hooks/useGradeTestRunner.js';
import { getRankDetails } from '../../../utils/rankUtils.js';

const GradeTestRunner = ({
  title,
  subtitle,
  questionsSource,
  passCount,
  typeLabels,
  grade,
  nextGrade,
  unlockGrade,
  focusText,
  prereqText,
  alreadyUnlockedText,
  getAlreadyUnlocked,
  getHasPrereq = () => true,
  largeChoiceTypes = [],
  mediumChoiceTypes = [],
  useCompoundHanjaBox = true,
  scoreClassName = 'text-[color:var(--color-primary-blue)]',
  onBack,
  onComplete,
  selectedCharacter,
  userXp,
}) => {
  const quiz = useGradeTestRunner({
    getAlreadyUnlocked,
    getHasPrereq,
    onBack,
    onComplete,
    passCount,
    questionsSource,
    typeLabels,
    unlockGrade,
  });

  const characterAvatar = useMemo(
    () => getRankDetails(userXp || 0, selectedCharacter).avatar,
    [userXp, selectedCharacter]
  );

  if (quiz.phase === 'intro') {
    return (
      <GradeTestIntro
        title={title}
        subtitle={subtitle}
        total={quiz.questionsLength}
        passCount={passCount}
        focusText={focusText}
        hasPrereq={quiz.hasPrereq}
        prereqText={prereqText}
        alreadyUnlocked={quiz.alreadyUnlocked}
        alreadyUnlockedText={alreadyUnlockedText}
        onBack={onBack}
        onStart={quiz.startQuiz}
      />
    );
  }

  if (quiz.phase === 'quiz') {
    return (
      <GradeTestQuizView
        characterAvatar={characterAvatar}
        largeChoiceTypes={largeChoiceTypes}
        mediumChoiceTypes={mediumChoiceTypes}
        onBack={onBack}
        onSelect={quiz.handleSelect}
        qIndex={quiz.qIndex}
        question={quiz.q}
        questionsLength={quiz.questionsLength}
        revealed={quiz.revealed}
        selected={quiz.selected}
        selectedCharacter={selectedCharacter}
        title={title}
        useCompoundHanjaBox={useCompoundHanjaBox}
      />
    );
  }

  return (
    <GradeTestResult
      passed={quiz.passed}
      correct={quiz.correct}
      total={quiz.questionsLength}
      passCount={passCount}
      grade={grade}
      nextGrade={nextGrade}
      alreadyUnlocked={quiz.alreadyUnlocked}
      selectedCharacter={selectedCharacter}
      answers={quiz.answerLog}
      onRetry={quiz.resetQuiz}
      onFinish={quiz.handleFinish}
    />
  );
};

export default GradeTestRunner;
