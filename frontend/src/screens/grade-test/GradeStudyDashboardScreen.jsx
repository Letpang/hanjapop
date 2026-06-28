import GradeDashboardHeader from './dashboard/components/GradeDashboardHeader.jsx';
import GradeMenuGrid from './dashboard/components/GradeMenuGrid.jsx';
import GradeProgressCard from './dashboard/components/GradeProgressCard.jsx';
import GradeVocabularyPreview from './dashboard/components/GradeVocabularyPreview.jsx';
import GradeVocabularyView from './dashboard/components/GradeVocabularyView.jsx';
import { useGradeDashboardController } from './dashboard/hooks/useGradeDashboardController.js';

const GradeStudyDashboardScreen = ({
  grade,
  onBack,
  onStartFocusStudy,
  onStartWordQuiz,
  onStartSentenceQuiz,
  onStartMockTest,
  unlockedPack,
  onShowPremiumModal,
  clearedHanjaIds = [],
}) => {
  const dashboard = useGradeDashboardController({
    grade,
    unlockedPack,
    clearedHanjaIds,
    onShowPremiumModal,
    onStartFocusStudy,
    onStartMockTest,
    onStartSentenceQuiz,
    onStartWordQuiz,
  });

  if (dashboard.showVocabulary) {
    return (
      <GradeVocabularyView
        normalizedGrade={dashboard.normalizedGrade}
        wordTab={dashboard.wordTab}
        setWordTab={dashboard.setWordTab}
        wordSearch={dashboard.wordSearch}
        setWordSearch={dashboard.setWordSearch}
        gradeWords={dashboard.gradeWords}
        gradeIdioms={dashboard.gradeIdioms}
        filteredVocabulary={dashboard.filteredVocabulary}
        theme={dashboard.theme}
        onBack={dashboard.handleBackToDashboard}
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
      <GradeDashboardHeader
        normalizedGrade={dashboard.normalizedGrade}
        isUnlocked={dashboard.isUnlocked}
        onBack={onBack}
      />

      <main className="flex-1 overflow-y-auto px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col gap-7 w-full max-w-2xl mx-auto">
        <GradeProgressCard
          normalizedGrade={dashboard.normalizedGrade}
          theme={dashboard.theme}
          progressPct={dashboard.progressPct}
          clearedCount={dashboard.clearedCount}
          hanjaCount={dashboard.hanjaList.length}
          mockPassed={dashboard.mockPassed}
          onPrimaryClick={dashboard.handlePrimaryClick}
        />

        <GradeMenuGrid
          normalizedGrade={dashboard.normalizedGrade}
          theme={dashboard.theme}
          isUnlocked={dashboard.isUnlocked}
          menuItems={dashboard.menuItems}
          onAction={dashboard.handleActionClick}
        />

        <GradeVocabularyPreview
          normalizedGrade={dashboard.normalizedGrade}
          gradeWords={dashboard.gradeWords}
          gradeIdioms={dashboard.gradeIdioms}
          theme={dashboard.theme}
          onOpenVocabulary={dashboard.openVocabulary}
        />
      </main>
    </div>
  );
};

export default GradeStudyDashboardScreen;
