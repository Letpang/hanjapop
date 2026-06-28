import FlashcardAllDoneModal from './FlashcardAllDoneModal.jsx';
import FlashcardExitModal from './FlashcardExitModal.jsx';

const FlashcardModals = ({ onBack, selectedCharacter, session }) => (
  <>
    {session.showExitModal && (
      <FlashcardExitModal
        onCancel={() => session.setShowExitModal(false)}
        onConfirm={session.handleExitConfirm}
        selectedCharacter={selectedCharacter}
      />
    )}

    {session.showAllDoneModal && (
      <FlashcardAllDoneModal
        clearMessage={session.allDoneClearMsg}
        onBack={onBack}
        onClose={() => session.setShowAllDoneModal(false)}
        reward={session.allDoneReward}
        selectedCharacter={selectedCharacter}
        totalQuizXp={session.totalQuizXp}
      />
    )}
  </>
);

export default FlashcardModals;
