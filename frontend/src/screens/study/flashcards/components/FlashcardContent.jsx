import FlashcardEmptyState from './FlashcardEmptyState.jsx';
import HanjaCard from './HanjaCard.jsx';
import HanjaStudySheet from './HanjaStudySheet.jsx';

const FlashcardContent = ({
  getRewardPreview,
  onBack,
  onHanjaAcquired,
  onMarkCorrect,
  onMarkWordWrong,
  onMarkWrong,
  selectedCharacter,
  session,
}) => (
  <div className="flex-1 flex flex-col overflow-hidden pt-2">
    {session.currentItems.length === 0 ? (
      <FlashcardEmptyState onBack={onBack} />
    ) : session.inSequenceMode ? (
      <div className="flex-1 overflow-hidden">
        <HanjaStudySheet
          key={session.currentIndex}
          item={session.currentItem}
          onBack={onBack}
          onMarkCorrect={onMarkCorrect}
          onMarkWrong={onMarkWrong}
          onMarkWordWrong={onMarkWordWrong}
          onHanjaAcquired={onHanjaAcquired}
          isSequence
          onNext={session.handleNext}
          isLast={session.currentIndex === session.currentItems.length - 1}
          isAlreadyCompleted={session.completedStudyIds.has(session.currentItem?.id)}
          onStudySheetComplete={session.handleStudySheetComplete}
          onQuizXp={session.addQuizXp}
          selectedCharacter={selectedCharacter}
          getRewardPreview={getRewardPreview}
          characterAvatar={session.characterAvatar}
        />
      </div>
    ) : (
      <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5 flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {session.currentItems.map((item) => (
            <HanjaCard
              key={item.id}
              item={item}
              isLocked={!session.isUnlocked(item)}
              isCompleted={session.completedStudyIds.has(item.id)}
              onClick={() => session.handleCardClick(item)}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

export default FlashcardContent;
