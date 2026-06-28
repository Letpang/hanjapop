import useIdiomQuiz from '../hooks/useIdiomQuiz.js';
import IdiomExitModal from './IdiomExitModal.jsx';
import IdiomQuizEmptyState from './IdiomQuizEmptyState.jsx';
import IdiomQuizHeader from './IdiomQuizHeader.jsx';
import IdiomQuizPlayCard from './IdiomQuizPlayCard.jsx';
import IdiomQuizResult from './IdiomQuizResult.jsx';

const IdiomQuiz = ({
  idioms,
  allIdioms,
  onBack,
  onComplete,
  userXp,
  selectedCharacter,
  getRewardPreview,
  missionDone = false,
}) => {
  const quiz = useIdiomQuiz({
    idioms,
    allIdioms,
    onComplete,
    userXp,
    selectedCharacter,
    missionDone,
  });

  if (!quiz.question) {
    return <IdiomQuizEmptyState onBack={onBack} />;
  }

  return (
    <div className="idiom-quiz-shell">
      <IdiomQuizHeader
        idx={quiz.idx}
        total={quiz.questions.length}
        currentAnswered={quiz.currentAnswered}
        completing={quiz.completing}
        characterAvatar={quiz.characterAvatar}
        selectedCharacter={selectedCharacter}
        onRequestExit={() => quiz.setShowExitModal(true)}
      />

      <IdiomQuizPlayCard
        question={quiz.question}
        idx={quiz.idx}
        total={quiz.questions.length}
        completing={quiz.completing}
        onCorrect={quiz.handleCorrect}
        onWrong={quiz.handleWrong}
        onNext={quiz.handleNext}
        onPrev={quiz.handlePrev}
        onCorrectSelected={() => quiz.setCurrentAnswered(true)}
      />

      <IdiomExitModal
        isOpen={quiz.showExitModal}
        selectedCharacter={selectedCharacter}
        onKeepGoing={() => quiz.setShowExitModal(false)}
        onBack={onBack}
      />

      <IdiomQuizResult
        done={quiz.done}
        score={quiz.score}
        total={quiz.questions.length}
        resultClearMsg={quiz.resultClearMsg}
        selectedCharacter={selectedCharacter}
        getRewardPreview={getRewardPreview}
        missionXp={quiz.missionXpGranted}
        onRetry={quiz.resetQuiz}
        onBack={onBack}
      />
    </div>
  );
};

export default IdiomQuiz;
