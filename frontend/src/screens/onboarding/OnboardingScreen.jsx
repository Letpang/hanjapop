import OnboardingGamePick from './components/OnboardingGamePick.jsx';
import OnboardingIntro from './components/OnboardingIntro.jsx';
import OnboardingPracticeGame from './components/OnboardingPracticeGame.jsx';
import OnboardingQuiz from './components/OnboardingQuiz.jsx';
import OnboardingResult from './components/OnboardingResult.jsx';
import { useOnboardingFlow } from './hooks/useOnboardingFlow.js';

const OnboardingScreen = ({ onComplete, selectedCharacter }) => {
  const flow = useOnboardingFlow({ onComplete, selectedCharacter });

  if (flow.step === 'intro') {
    return (
      <OnboardingIntro
        slideIdx={flow.slideIdx}
        onNext={flow.handleIntroNext}
        onSkip={flow.handleSkip}
        guide={flow.guide}
        charId={selectedCharacter}
      />
    );
  }

  if (flow.step === 'quiz') {
    return (
      <OnboardingQuiz
        question={flow.question}
        index={flow.qIdx}
        selected={flow.selected}
        isCorrect={flow.selected === flow.question.answer}
        onSelect={flow.handleSelect}
      />
    );
  }

  if (flow.step === 'gamePick') {
    return <OnboardingGamePick onPick={flow.handleGamePick} guide={flow.guide} charId={selectedCharacter} />;
  }

  if (flow.step === 'shoot' || flow.step === 'match') {
    return (
      <OnboardingPracticeGame
        game={flow.step}
        onDone={flow.handleGameDone}
        selectedCharacter={selectedCharacter}
      />
    );
  }

  return (
    <OnboardingResult
      score={flow.score}
      finalLevel={flow.finalLevel}
      skillStats={flow.skillStats}
      onComplete={flow.handleComplete}
      guide={flow.guide}
      charId={selectedCharacter}
    />
  );
};

export default OnboardingScreen;
