import { incrementTodaySessionCount } from '../../utils/sessionUtils.js';
import { DailySessionScreen } from '../appScreens.js';

const DailySessionFlow = ({
  activateReferralForDailyClear,
  addBonusXp,
  advanceDay,
  checkAndShowMissionToast,
  claimFinalJourney,
  currentDay,
  doneCount,
  finalJourney,
  getRewardPreview,
  handleHanjaAcquired,
  hanjaData,
  journeyRound,
  logCorrectWord,
  logHanja,
  logWrongWord,
  logWord,
  markCorrect,
  markSeen,
  markWordCorrect,
  markWordWrong,
  markWrong,
  selectedCharacter,
  sessionMissions,
  setCurrentScreen,
  setSessionDoneToday,
  setShowNewJourneyModal,
  setShowSaveModal,
  userNickname,
  userRef,
  userXp,
  wordData,
  updateMissionProgress,
}) => (
  <DailySessionScreen
    onComplete={({ skipLoginModal, isFinalJourney, hanjaCount } = {}) => {
      if (isFinalJourney) {
        claimFinalJourney({ hanjaCount });
        if (!finalJourney) addBonusXp(1240);
        setShowNewJourneyModal(true);
      }
      setSessionDoneToday(true);
      addBonusXp(200);
      activateReferralForDailyClear();
      if (userRef.current || skipLoginModal) {
        setCurrentScreen('main');
      } else {
        setShowSaveModal(true);
      }
    }}
    onNavigate={setCurrentScreen}
    onAdvanceDay={() => { advanceDay(); incrementTodaySessionCount(); }}
    currentDay={currentDay}
    journeyRound={journeyRound}
    srsData={hanjaData}
    masteryData={hanjaData}
    wordData={wordData}
    selectedCharacter={selectedCharacter}
    userNickname={userNickname}
    userXp={userXp}
    onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
    onMarkWrong={(id) => { markWrong(id); logHanja(id); }}
    onMarkSeen={(id) => { markSeen(id); logHanja(id); }}
    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
    onWordSeen={(wordId) => logWord(wordId)}
    onHanjaAcquired={handleHanjaAcquired}
    updateMissionProgress={updateMissionProgress}
    addBonusXp={addBonusXp}
    getRewardPreview={getRewardPreview}
    missions={sessionMissions}
    doneCount={doneCount}
    onMapIdle={checkAndShowMissionToast}
  />
);

export default DailySessionFlow;
