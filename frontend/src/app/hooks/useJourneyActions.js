import { useCallback } from 'react';
import { SK } from '../../constants/storageKeys.js';

export const useJourneyActions = ({
  setCurrentScreen,
  setOpenMemoryVaultSignal,
  setSelectedGrade,
  setSelectedPastStage,
  setSessionDoneToday,
  setShowNewJourneyModal,
  startNewJourney,
}) => {
  const handleStartNewJourney = useCallback(() => {
    startNewJourney();
    setSessionDoneToday(false);
    setSelectedPastStage(null);
    setSelectedGrade(null);
    setCurrentScreen('main');
    setShowNewJourneyModal(false);
    try {
      localStorage.removeItem(SK.DAILY_SESSION);
      localStorage.removeItem('daily_map_progress');
    } catch {}
  }, [
    setCurrentScreen,
    setSelectedGrade,
    setSelectedPastStage,
    setSessionDoneToday,
    setShowNewJourneyModal,
    startNewJourney,
  ]);

  const handleBrowseJourneyMemory = useCallback(() => {
    setShowNewJourneyModal(false);
    setCurrentScreen('main');
    setOpenMemoryVaultSignal((value) => value + 1);
  }, [setCurrentScreen, setOpenMemoryVaultSignal, setShowNewJourneyModal]);

  return {
    handleBrowseJourneyMemory,
    handleStartNewJourney,
  };
};
