import useHanjaStudySheet from '../hooks/useHanjaStudySheet.js';
import HanjaStudySheetBody from './study-sheet/HanjaStudySheetBody.jsx';
import StudyCompleteModal from './study-sheet/StudyCompleteModal.jsx';
import StudySheetHeader from './study-sheet/StudySheetHeader.jsx';
import StudySheetXpPopup from './study-sheet/StudySheetXpPopup.jsx';

const HanjaStudySheet = ({
  item,
  onBack,
  onMarkCorrect,
  onMarkWrong,
  onMarkWordWrong,
  onHanjaAcquired,
  isSequence,
  onNext,
  isLast,
  isAlreadyCompleted = false,
  onStudySheetComplete,
  onQuizXp,
  selectedCharacter,
  getRewardPreview,
  characterAvatar,
}) => {
  const study = useHanjaStudySheet({
    item,
    onBack,
    onMarkCorrect,
    onMarkWrong,
    onMarkWordWrong,
    onHanjaAcquired,
    isSequence,
    onNext,
    isLast,
    onStudySheetComplete,
    onQuizXp,
  });

  const closeCompleteModal = () => {
    study.setQuizDone(false);
    onNext?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
      <StudySheetXpPopup popup={study.xpPopup} />

      <StudySheetHeader
        onBack={onBack}
        answerCount={study.answerCount}
        questionCount={study.questions.length}
        characterAvatar={characterAvatar}
        selectedCharacter={selectedCharacter}
      />

      <HanjaStudySheetBody item={item} study={study} />

      <StudyCompleteModal
        isOpen={study.quizDone}
        onClose={closeCompleteModal}
        selectedCharacter={selectedCharacter}
        getRewardPreview={getRewardPreview}
        correctAnswerCount={study.correctAnswerCount}
        isAlreadyCompleted={isAlreadyCompleted}
      />
    </div>
  );
};

export default HanjaStudySheet;
