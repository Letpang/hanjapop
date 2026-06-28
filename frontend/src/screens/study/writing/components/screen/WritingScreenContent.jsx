import WritingQuizCard from '../WritingQuizCard.jsx';
import WritingResultScreen from '../WritingResultScreen.jsx';
import WritingListView from './WritingListView.jsx';
import WritingSelectView from './WritingSelectView.jsx';

const WritingScreenContent = ({
  getRewardPreview,
  isPremium,
  selectedCharacter,
  showPremiumGate,
  writing,
}) => (
  <div className="flex-1 overflow-y-auto pb-6">
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 pt-5">
      {writing.phase === 'select' && (
        <WritingSelectView
          viewMode={writing.viewMode}
          setViewMode={writing.setViewMode}
          gradeFilter={writing.gradeFilter}
          setGradeFilter={writing.setGradeFilter}
          categoryFilter={writing.categoryFilter}
          setCategoryFilter={writing.setCategoryFilter}
          isPremium={isPremium}
          showPremiumGate={showPremiumGate}
          unlockedGrades={writing.unlockedGrades}
          unlockedIds={writing.unlockedIds}
          characterAvatar={writing.characterAvatar}
          onOpenList={() => writing.setPhase('list')}
        />
      )}

      {writing.phase === 'list' && (
        <WritingListView
          displayList={writing.displayList}
          completedIds={writing.completedIds}
          onCardClick={writing.handleCardClick}
        />
      )}

      {writing.phase === 'quiz' && writing.selectedHanja && (
        <WritingQuizCard
          key={writing.selectedHanja.id}
          hanja={writing.selectedHanja}
          hanjaList={writing.activeHanjaList}
          currentIndex={writing.currentIndex}
          onWritingComplete={writing.handleWritingCompleteLocal}
          onNextHanja={writing.handleNextHanja}
          onBack={() => writing.setPhase('list')}
        />
      )}

      {writing.phase === 'result' && (
        <WritingResultScreen
          correct={writing.completedCount}
          total={writing.activeHanjaList.length}
          onRetry={writing.startQuiz}
          onBack={writing.handleResultBack}
          selectedCharacter={selectedCharacter}
          getRewardPreview={getRewardPreview}
          missionXp={writing.missionXp}
        />
      )}
    </div>
  </div>
);

export default WritingScreenContent;
