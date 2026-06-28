import LevelTestIntro from './level-test/components/LevelTestIntro.jsx';
import LevelTestQuiz from './level-test/components/LevelTestQuiz.jsx';
import LevelTestResultModal from './level-test/components/LevelTestResultModal.jsx';
import useLevelTest from './level-test/hooks/useLevelTest.js';

const LevelTestScreen = ({ onBack, onComplete, onHanjaAcquired, selectedCharacter }) => {
  const test = useLevelTest({ onBack, onComplete, onHanjaAcquired });

  if (test.phase === 'intro') {
    return (
      <LevelTestIntro
        onBack={onBack}
        onStart={test.handleStart}
        questionCount={test.questions.length}
        passThreshold={test.passThreshold}
        unlockedCount={test.unlockedHanja.length}
      />
    );
  }

  if (test.phase === 'quiz' || test.phase === 'result') {
    return (
      <>
        <LevelTestQuiz
          xpPopup={test.xpPopup}
          question={test.currentQuestion}
          qIndex={test.qIndex}
          questions={test.questions}
          progress={test.progress}
          isHanjaDisplay={test.isHanjaDisplay}
          selected={test.selected}
          revealed={test.revealed}
          onBackToIntro={() => test.setPhase('intro')}
          onSelect={test.handleSelect}
          onNext={test.handleNext}
        />

        <LevelTestResultModal
          isOpen={test.phase === 'result'}
          passed={test.passed}
          correctCount={test.correctCount}
          questions={test.questions}
          answers={test.answers}
          passThreshold={test.passThreshold}
          selectedCharacter={selectedCharacter}
          onFinish={test.handleFinish}
        />
      </>
    );
  }

  return null;
};

export default LevelTestScreen;
