import { useLang } from '../../../hooks/useLang.js';

const QuizCardNav = ({ completing, isCorrectSelected, isFirst, isLast, onNext, onPrev }) => {
  const { t } = useLang();

  return (
    <div className={`quiz-card-nav-row pt-2 sm:pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] w-full flex gap-3 transition-opacity duration-300 ${isCorrectSelected && !completing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {!isFirst && <button onClick={onPrev} className="quiz-prev-btn flex-[1.5]">{t('ext_940')}</button>}
      <button onClick={onNext} className={`quiz-next-btn ${isFirst ? 'w-full' : 'flex-[2.5]'}`}>
        {isLast ? t('ext_1479') : t('ext_279')}
      </button>
    </div>
  );
};

export default QuizCardNav;