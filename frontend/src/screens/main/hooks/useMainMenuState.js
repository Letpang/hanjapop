import { useEffect, useMemo, useState } from 'react';
import { usePremium } from '../../../hooks/usePremium.js';

export const useMainMenuState = ({
  missions,
  doneCount,
  currentDay,
  selectedPastStage,
  selectedGrade,
  isJourneyComplete,
  onOpenNewJourney,
  onStartNextStage,
  openMemoryVaultSignal,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showPremiumGate, canAccessStage } = usePremium();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (openMemoryVaultSignal > 0) setShowModal(true);
  }, [openMemoryVaultSignal]);

  const menuState = useMemo(() => {
    const missionTotal = missions?.length || 6;
    const missionDone = doneCount || 0;
    const allDone = missionDone >= missionTotal;
    const isDailyComplete = allDone && !selectedPastStage && !selectedGrade;
    const targetStage = selectedPastStage || currentDay;
    const isStageLocked = !selectedGrade && !isJourneyComplete && !canAccessStage(targetStage);

    return {
      allDone,
      isDailyComplete,
      isStageLocked,
      missionDone,
      missionTotal,
      targetStage,
    };
  }, [
    canAccessStage,
    currentDay,
    doneCount,
    isJourneyComplete,
    missions,
    selectedGrade,
    selectedPastStage,
  ]);

  const handlePrimaryCta = () => {
    if (menuState.isStageLocked) {
      setShowModal(true);
      return;
    }
    if (isJourneyComplete && !selectedPastStage) {
      onOpenNewJourney?.();
      return;
    }
    onStartNextStage?.();
  };

  const entranceStyle = (delay = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.4s ease ${delay}s, transform 0.4s cubic-bezier(0.25,0.8,0.25,1) ${delay}s`,
  });

  return {
    ...menuState,
    canAccessStage,
    entranceStyle,
    handlePrimaryCta,
    setShowModal,
    showModal,
    showPremiumGate,
  };
};
