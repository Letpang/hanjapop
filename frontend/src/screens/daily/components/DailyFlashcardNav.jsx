import { useLang } from '../../../hooks/useLang.js';

const DailyFlashcardNav = ({ currentIndex, isFlipped, isLastCard, onNext, onPrevious }) => {
  const { t } = useLang();

  return (
    <div className="flex gap-3 w-full mt-3">
      <button
        disabled={currentIndex === 0}
        onClick={onPrevious}
        className="quiz-prev-btn flex-[1.5] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {t('ext_1762')}
      </button>
      <button
        onClick={onNext}
        disabled={!isFlipped}
        className="quiz-next-btn flex-[2.5] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isLastCard ? t('ext_276') : t('ext_279')}
      </button>
    </div>
  );
};

export default DailyFlashcardNav;