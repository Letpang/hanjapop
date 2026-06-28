import HanjaStudySheet from './HanjaStudySheet.jsx';

const FlashcardStudySheetLayer = ({
  getRewardPreview,
  onHanjaAcquired,
  onMarkCorrect,
  onMarkWordWrong,
  onMarkWrong,
  selectedCharacter,
  session,
}) => {
  if (!session.studyItem || session.inSequenceMode) return null;

  return (
    <HanjaStudySheet
      item={session.studyItem}
      onBack={() => session.setStudyItem(null)}
      onMarkCorrect={onMarkCorrect}
      onMarkWrong={onMarkWrong}
      onMarkWordWrong={onMarkWordWrong}
      onHanjaAcquired={onHanjaAcquired}
      isAlreadyCompleted={session.completedStudyIds.has(session.studyItem.id)}
      onStudySheetComplete={session.handleStudySheetComplete}
      onQuizXp={session.addQuizXp}
      selectedCharacter={selectedCharacter}
      getRewardPreview={getRewardPreview}
      characterAvatar={session.characterAvatar}
    />
  );
};

export default FlashcardStudySheetLayer;
