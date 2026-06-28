import FlashcardContent from './flashcards/components/FlashcardContent.jsx';
import FlashcardHeader from './flashcards/components/FlashcardHeader.jsx';
import FlashcardModals from './flashcards/components/FlashcardModals.jsx';
import FlashcardStudySheetLayer from './flashcards/components/FlashcardStudySheetLayer.jsx';
import { useFlashcardSession } from './flashcards/hooks/useFlashcardSession.js';

const FlashcardScreen = ({
  onBack,
  onCardFlip,
  onMarkCorrect,
  onMarkWrong,
  onMarkWordWrong,
  hanjaFilter,
  onStageClear,
  unlockedHanjaIds,
  onHanjaAcquired,
  userXp,
  selectedCharacter,
  getRewardPreview,
  onStudySheetComplete,
  contentPool = null,
  currentDay = null,
}) => {
  const session = useFlashcardSession({
    contentPool,
    currentDay,
    getRewardPreview,
    hanjaFilter,
    onBack,
    onCardFlip,
    onStageClear,
    onStudySheetComplete,
    selectedCharacter,
    unlockedHanjaIds,
    userXp,
  });

  return (
    <div className="quiz-screen animate-fade-in">
      <FlashcardStudySheetLayer
        getRewardPreview={getRewardPreview}
        onHanjaAcquired={onHanjaAcquired}
        onMarkCorrect={onMarkCorrect}
        onMarkWordWrong={onMarkWordWrong}
        onMarkWrong={onMarkWrong}
        selectedCharacter={selectedCharacter}
        session={session}
      />

      <FlashcardHeader
        characterAvatar={session.characterAvatar}
        completing={session.completing}
        currentIndex={session.currentIndex}
        currentItems={session.currentItems}
        inSequenceMode={session.inSequenceMode}
        onBack={onBack}
        onRequestExit={() => session.setShowExitModal(true)}
        selectedCharacter={selectedCharacter}
        shouldShowProgress={session.shouldShowProgress}
      />

      <FlashcardContent
        getRewardPreview={getRewardPreview}
        onBack={onBack}
        onHanjaAcquired={onHanjaAcquired}
        onMarkCorrect={onMarkCorrect}
        onMarkWordWrong={onMarkWordWrong}
        onMarkWrong={onMarkWrong}
        selectedCharacter={selectedCharacter}
        session={session}
      />

      <FlashcardModals onBack={onBack} selectedCharacter={selectedCharacter} session={session} />
    </div>
  );
};

export default FlashcardScreen;
