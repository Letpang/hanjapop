import { usePremium } from '../../hooks/usePremium.js';
import WritingQuizCard from './writing/components/WritingQuizCard.jsx';
import WritingExitModal from './writing/components/screen/WritingExitModal.jsx';
import WritingScreenContent from './writing/components/screen/WritingScreenContent.jsx';
import WritingScreenHeader from './writing/components/screen/WritingScreenHeader.jsx';
import useWritingScreenState from './writing/hooks/useWritingScreenState.js';

const WritingScreen = ({
  onBack,
  onWritingComplete,
  onStageClear,
  initialHanja,
  unlockedHanjaIds,
  userXp,
  selectedCharacter,
  getRewardPreview,
  hanjaFilter,
  isPremium = false,
  contentPool = null,
}) => {
  const { showPremiumGate } = usePremium();
  const writing = useWritingScreenState({
    initialHanja,
    unlockedHanjaIds,
    userXp,
    selectedCharacter,
    hanjaFilter,
    contentPool,
    onBack,
    onWritingComplete,
    onStageClear,
  });

  return (
    <div className={`quiz-screen quiz-screen--plain ${writing.phase === 'select' ? '' : ''}`}>
      <WritingScreenHeader
        phase={writing.phase}
        onBack={writing.handleHeaderBack}
        activeHanjaList={writing.activeHanjaList}
        currentIndex={writing.currentIndex}
        startIndex={writing.startIndex}
        currentAnswered={writing.currentAnswered}
        completing={writing.completing}
        characterAvatar={writing.characterAvatar}
        selectedCharacter={selectedCharacter}
      />

      <WritingScreenContent
        getRewardPreview={getRewardPreview}
        isPremium={isPremium}
        selectedCharacter={selectedCharacter}
        showPremiumGate={showPremiumGate}
        writing={writing}
      />

      <WritingExitModal
        isOpen={writing.showExitModal}
        selectedCharacter={selectedCharacter}
        onKeepGoing={() => writing.setShowExitModal(false)}
        onExit={writing.handleExitConfirm}
      />
    </div>
  );
};

export { WritingQuizCard as QuizCard };
export default WritingScreen;
