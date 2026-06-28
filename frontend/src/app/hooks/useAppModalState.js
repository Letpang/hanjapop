import { useState } from 'react';

export const useAppModalState = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [gradeTestAlert, setGradeTestAlert] = useState(null);
  const [gradeTestBackScreen, setGradeTestBackScreen] = useState('mypage');
  const [showNewJourneyModal, setShowNewJourneyModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [openMemoryVaultSignal, setOpenMemoryVaultSignal] = useState(0);

  return {
    gradeTestAlert,
    gradeTestBackScreen,
    openMemoryVaultSignal,
    setGradeTestAlert,
    setGradeTestBackScreen,
    setOpenMemoryVaultSignal,
    setShowLoginModal,
    setShowNewJourneyModal,
    setShowPremiumModal,
    setShowSaveModal,
    showLoginModal,
    showNewJourneyModal,
    showPremiumModal,
    showSaveModal,
  };
};
