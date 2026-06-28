import { FlashcardScreen } from '../../../appScreens.js';

const FlashcardRoute = ({
  addBonusXp,
  addTodayStat,
  backToMain,
  clearedHanjaIds,
  currentDay,
  effectivePool,
  getRewardPreview,
  handleHanjaAcquired,
  isPremium,
  logHanja,
  logWrongWord,
  markCorrect,
  markSeen,
  markWordWrong,
  markWrong,
  selectedCharacter,
  setCurrentScreen,
  setWriteTargetHanja,
  updateMissionProgress,
  userXp,
}) => (
  <FlashcardScreen
    onBack={backToMain}
    isPremium={isPremium}
    contentPool={effectivePool}
    currentDay={currentDay}
    unlockedHanjaIds={clearedHanjaIds}
    onHanjaAcquired={handleHanjaAcquired}
    onStageClear={() => {
      handleHanjaAcquired(null, 50);
      updateMissionProgress('flashcard', 1, addBonusXp);
      addTodayStat('flashcard');
    }}
    onCardFlip={(id) => {
      if (id) {
        markSeen(id);
        logHanja(id);
      }
    }}
    onWriteHanja={(hanja) => {
      setWriteTargetHanja(hanja);
      setCurrentScreen('writing');
    }}
    onMarkCorrect={(id) => markCorrect(id)}
    onMarkWrong={(id) => markWrong(id)}
    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => {
      markWordWrong(wordId, hanjaId, reading, meaning);
      logWrongWord(wordId);
    }}
    onStudySheetComplete={() => {}}
    userXp={userXp}
    selectedCharacter={selectedCharacter}
    getRewardPreview={getRewardPreview}
  />
);

export default FlashcardRoute;
