import { WritingScreen } from '../../../appScreens.js';

const WritingRoute = ({
  addBonusXp,
  addTodayStat,
  backToMain,
  clearedHanjaIds,
  effectivePool,
  getRewardPreview,
  handleHanjaAcquired,
  isPremium,
  logHanja,
  markCorrect,
  markSeen,
  markWrong,
  selectedCharacter,
  setWriteTargetHanja,
  updateMissionProgress,
  userXp,
  writeTargetHanja,
}) => (
  <WritingScreen
    onBack={() => {
      setWriteTargetHanja(null);
      backToMain();
    }}
    onWritingComplete={(id, score) => {
      const writingXp = 10;
      handleHanjaAcquired(id || null, writingXp);
      if (id) {
        markSeen(id);
        logHanja(id);
      }
      if (id) {
        if (score >= 70) markCorrect(id);
        else markWrong(id);
      }
    }}
    onStageClear={() => {
      handleHanjaAcquired(null, 30);
      updateMissionProgress('writing', 1, addBonusXp);
      addTodayStat('writing');
    }}
    initialHanja={writeTargetHanja}
    isPremium={isPremium}
    contentPool={effectivePool}
    unlockedHanjaIds={clearedHanjaIds}
    userXp={userXp}
    selectedCharacter={selectedCharacter}
    getRewardPreview={getRewardPreview}
  />
);

export default WritingRoute;
