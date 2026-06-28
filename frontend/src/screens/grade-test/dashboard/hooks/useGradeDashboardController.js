import { useState } from 'react';
import { useLang } from '../../../../hooks/useLang.js';
import { useGradeDashboardData } from './useGradeDashboardData.js';

export const useGradeDashboardController = ({
  clearedHanjaIds,
  grade,
  onShowPremiumModal,
  onStartFocusStudy,
  onStartMockTest,
  onStartSentenceQuiz,
  onStartWordQuiz,
  unlockedPack,
}) => {
  const { t } = useLang();
  const [wordTab, setWordTab] = useState('words');
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [wordSearch, setWordSearch] = useState('');

  const dashboard = useGradeDashboardData({
    grade,
    unlockedPack,
    clearedHanjaIds,
    wordTab,
    wordSearch,
  });

  const handleActionClick = (actionFn) => {
    if (!dashboard.isUnlocked) {
      onShowPremiumModal?.();
      return;
    }
    actionFn?.();
  };

  const handlePrimaryClick = () => {
    if (dashboard.progressPct === 100 && !dashboard.mockPassed) {
      handleActionClick(onStartMockTest);
      return;
    }
    handleActionClick(() => onStartFocusStudy?.(dashboard.hanjaList));
  };

  const handleBackToDashboard = () => {
    setShowVocabulary(false);
    setWordSearch('');
  };

  const openVocabulary = () => {
    setWordTab('words');
    setShowVocabulary(true);
  };

  const menuItems = [
    { type: 'study', title: t('ext_1505'), desc: t('ext_2681', { count: dashboard.hanjaList.length }), action: () => onStartFocusStudy?.(dashboard.hanjaList) },
    { type: 'word', title: t('ext_1492'), desc: t('ext_2692', { count: dashboard.gradeWords.length }), action: onStartWordQuiz },
    { type: 'sentence', title: t('ext_1493'), desc: t('ext_2705', { count: dashboard.gradeSentenceCount }), action: onStartSentenceQuiz },
    { type: 'exam', title: t('ext_1392'), desc: dashboard.mockPassed ? t('ext_1506') : t('ext_1676'), action: onStartMockTest },
  ];

  return {
    ...dashboard,
    handleActionClick,
    handleBackToDashboard,
    handlePrimaryClick,
    menuItems,
    openVocabulary,
    setWordSearch,
    setWordTab,
    showVocabulary,
    wordSearch,
    wordTab,
  };
};
