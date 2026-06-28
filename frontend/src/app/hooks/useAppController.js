import { useCallback, useEffect } from 'react';
import { useAdMob } from '../../hooks/useAdMob.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useVersionCheck } from '../../hooks/useVersionCheck.js';
import { getLevel } from '../../utils/rankUtils.js';
import {
  buildContentFlowProps,
  buildOverlayProps,
  buildRouterProps,
} from './appControllerProps.js';
import { useAppEntitlements } from './useAppEntitlements.ts';
import { useAppModalState } from './useAppModalState.js';
import { useAppNavigation } from './useAppNavigation.js';
import { useAppPreferences } from './useAppPreferences.js';
import { useAppRewards } from './useAppRewards.ts';
import { useCharacterToasts } from './useCharacterToasts.js';
import { useCloudRestoreChoice } from './useCloudRestoreChoice.js';
import { useGradeTestAlert } from './useGradeTestAlert.js';
import { useJourneyActions } from './useJourneyActions.js';
import { useAppLearningState } from './useAppLearningState.js';
import { useLatestRef } from './useLatestRef.js';
import { useLegacyStorageCleanup } from './useLegacyStorageCleanup.js';
import { usePremiumWidgetState } from './usePremiumWidgetState.js';
import { useWakeLock } from './useWakeLock.js';

export function useAppController() {
  const {
    user,
    loading: authLoading,
    platform,
    signInWithApple,
    signInWithGoogle,
    signInWithKakao,
    signOut: authSignOut,
    linkIdentity,
  } = useAuth();
  const userRef = useLatestRef(user);
  const modalState = useAppModalState();
  const {
    setGradeTestAlert,
    setOpenMemoryVaultSignal,
    setShowLoginModal,
    setShowNewJourneyModal,
    setShowPremiumModal,
  } = modalState;

  const {
    referralOffer,
    setReferralOffer,
    unlockedPack,
    setUnlockedPack,
    isPremium,
  } = useAppEntitlements(user);

  const {
    onboardingDone,
    setOnboardingDone,
    userXp,
    setUserXp,
    isDarkMode,
    setIsDarkMode,
    selectedCharacter,
    setSelectedCharacter,
    userNickname,
    setUserNickname,
    sessionDoneToday,
    setSessionDoneToday,
  } = useAppPreferences();

  const {
    backToMain,
    currentScreen,
    selectedDashboardGrade,
    selectedGrade,
    selectedPastStage,
    sessionReviewPool,
    setCurrentScreen,
    setSelectedDashboardGrade,
    setSelectedGrade,
    setSelectedPastStage,
    setSessionReviewPool,
    setWriteTargetHanja,
    writeTargetHanja,
  } = useAppNavigation();

  const handleAfterInterstitial = useCallback(() => {
    if (!isPremium) setShowPremiumModal(true);
  }, [isPremium]);
  const { showInterstitial } = useAdMob({ onAfterInterstitial: handleAfterInterstitial });

  useWakeLock();
  const versionInfo = useVersionCheck();

  useEffect(() => {
    if (currentScreen === 'main' && !isPremium) showInterstitial();
  }, [currentScreen, isPremium, showInterstitial]);

  const learningState = useAppLearningState({
    selectedGrade,
    selectedPastStage,
    sessionDoneToday,
  });
  const {
    allDone,
    completedDay,
    currentDay,
    currentDayData,
    doneCount,
    hanjaData,
    logXp,
    missions,
    startNewJourney,
    streak,
    studyLog,
    totalStats,
    wordData,
  } = learningState;

  useLegacyStorageCleanup(completedDay);
  useGradeTestAlert(completedDay, setGradeTestAlert);
  usePremiumWidgetState({ allDone, currentDay, currentDayData, doneCount, isPremium, missions });

  const {
    handleBrowseJourneyMemory,
    handleStartNewJourney,
  } = useJourneyActions({
    setCurrentScreen,
    setOpenMemoryVaultSignal,
    setSelectedGrade,
    setSelectedPastStage,
    setSessionDoneToday,
    setShowNewJourneyModal,
    startNewJourney,
  });

  const openLoginModal = useCallback(() => setShowLoginModal(true), []);
  const {
    accountChoiceBusy,
    accountDataChoice,
    handleContinueWithoutLink,
    handleUsePreviousLogin,
    isRestoring,
    restoreFromCloud,
  } = useCloudRestoreChoice({
    authLoading,
    authSignOut,
    hanjaData,
    onShowLogin: openLoginModal,
    selectedCharacter,
    signInWithApple,
    signInWithGoogle,
    signInWithKakao,
    streak,
    studyLog,
    totalStats,
    user,
    userNickname,
    userXp,
    wordData,
  });

  const {
    activateReferralForDailyClear,
    addBonusXp,
    getRewardPreview,
    handleHanjaAcquired,
  } = useAppRewards({ logXp, setReferralOffer, setUserXp, userRef });

  const {
    charToast,
    checkAndShowMissionToast,
    dismissToast,
    isInRankSoonZone,
    nextRankAvatar,
    setCharToast,
    setShowRankUpModal,
    showRankUpModal,
  } = useCharacterToasts({
    allDone,
    currentDay,
    currentScreen,
    hanjaData,
    selectedCharacter,
    sessionDoneToday,
    unlockedPack,
    userXp,
    wordData,
  });

  const currentLevel = getLevel(userXp);
  const controllerState = {
    ...modalState,
    ...learningState,
    accountChoiceBusy,
    accountDataChoice,
    activateReferralForDailyClear,
    addBonusXp,
    authSignOut,
    backToMain,
    charToast,
    checkAndShowMissionToast,
    currentLevel,
    currentScreen,
    dismissToast,
    getRewardPreview,
    handleHanjaAcquired,
    handleBrowseJourneyMemory,
    handleContinueWithoutLink,
    handleStartNewJourney,
    handleUsePreviousLogin,
    isDarkMode,
    isInRankSoonZone,
    isPremium,
    isRestoring,
    linkIdentity,
    nextRankAvatar,
    onboardingDone,
    platform,
    referralOffer,
    restoreFromCloud,
    selectedCharacter,
    selectedDashboardGrade,
    selectedGrade,
    selectedPastStage,
    sessionDoneToday,
    sessionReviewPool,
    setCurrentScreen,
    setIsDarkMode,
    setOnboardingDone,
    setReferralOffer,
    setCharToast,
    setSelectedCharacter,
    setSelectedDashboardGrade,
    setSelectedGrade,
    setSelectedPastStage,
    setSessionDoneToday,
    setSessionReviewPool,
    setShowRankUpModal,
    setUnlockedPack,
    setUserNickname,
    setWriteTargetHanja,
    showRankUpModal,
    signInWithApple,
    signInWithGoogle,
    signInWithKakao,
    unlockedPack,
    user,
    userNickname,
    userRef,
    userXp,
    writeTargetHanja,
  };

  const routerProps = buildRouterProps(controllerState);
  const contentFlowProps = buildContentFlowProps({ ...controllerState, routerProps });
  const overlayProps = buildOverlayProps(controllerState);

  return {
    contentFlowProps,
    currentLevel,
    currentScreen,
    isDarkMode,
    onShowPremium: () => setShowPremiumModal(true),
    overlayProps,
    unlockedPack,
    versionInfo,
  };
}
