import { useCallback, useState } from 'react';

export const useAppNavigation = () => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [writeTargetHanja, setWriteTargetHanja] = useState(null);
  const [sessionReviewPool, setSessionReviewPool] = useState(null);
  const [selectedPastStage, setSelectedPastStage] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedDashboardGrade, setSelectedDashboardGrade] = useState(null);

  const backToMain = useCallback(() => {
    if (selectedDashboardGrade) {
      setCurrentScreen('gradeStudyDashboard');
      return;
    }

    setCurrentScreen('main');
    setSelectedPastStage(null);
    setSelectedGrade(null);
  }, [selectedDashboardGrade]);

  return {
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
  };
};
