import DailySessionStageRouter from './components/DailySessionStageRouter.jsx';
import useDailySessionController from './hooks/useDailySessionController.js';

const DailySessionScreen = ({
  onComplete,
  onAdvanceDay,
  currentDay,
  journeyRound = 1,
  srsData,
  masteryData,
  wordData,
  onMarkCorrect,
  onMarkSeen,
  onMarkWordWrong,
  onWordCorrect,
  onWordSeen,
  selectedCharacter,
  userNickname,
  updateMissionProgress,
  addTodayStat,
  addBonusXp,
  getRewardPreview,
  onHanjaAcquired,
  userXp,
  missions,
  onMapIdle,
}) => {
  const session = useDailySessionController({
    onComplete,
    onAdvanceDay,
    currentDay,
    journeyRound,
    srsData,
    masteryData,
    wordData,
    onMarkCorrect,
    onMarkSeen,
    onMarkWordWrong,
    onWordCorrect,
    onWordSeen,
    selectedCharacter,
    updateMissionProgress,
    addTodayStat,
    addBonusXp,
    getRewardPreview,
    onHanjaAcquired,
    userXp,
    missions,
    onMapIdle,
  });

  return (
    <DailySessionStageRouter
      missions={missions}
      selectedCharacter={selectedCharacter}
      session={session}
      userNickname={userNickname}
      userXp={userXp}
    />
  );
};

export default DailySessionScreen;
