import { canAccessStage } from '../../utils/premiumAccess.js';

const isPreviewingFinalJourney = () => (
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview-final-journey')
);

export const getAppFlowMode = ({
  currentDay,
  onboardingDone,
  selectedCharacter,
  sessionDoneToday,
  unlockedPack,
}) => {
  if (!selectedCharacter || !onboardingDone) return 'initial';

  if ((!sessionDoneToday && canAccessStage(unlockedPack, currentDay)) || isPreviewingFinalJourney()) {
    return 'daily';
  }

  return 'router';
};

export const getInitialAppFlowProps = ({
  handleHanjaAcquired,
  onboardingDone,
  selectedCharacter,
  setOnboardingDone,
  setSelectedCharacter,
  setUserNickname,
}) => ({
  handleHanjaAcquired,
  onboardingDone,
  selectedCharacter,
  setOnboardingDone,
  setSelectedCharacter,
  setUserNickname,
});

export const getDailySessionFlowProps = ({
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
  updateMissionProgress,
  userNickname,
  userRef,
  userXp,
  wordData,
}) => ({
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
  updateMissionProgress,
  userNickname,
  userRef,
  userXp,
  wordData,
});
