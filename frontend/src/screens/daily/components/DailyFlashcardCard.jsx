const topicColor = '#7C83FF';
import { useLang } from '../../../hooks/useLang.js';

const DailyFlashcardFront = ({ item }) => {
  const { t } = useLang();
  return (
    <div
      className="daily-study-card flashcard-face-front flex flex-col items-center justify-center overflow-hidden"
    >
      <img
        src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
        onError={(e) => { e.target.src = '/assets/images/hanja_placeholder.webp'; }}
        className="w-[clamp(100px,26vw,140px)] h-[clamp(100px,26vw,140px)] object-contain"
        alt={item.hanja}
      />
      <span className="daily-study-front-char font-normal text-[#3C3C3C] dark:text-slate-100 tracking-normaler leading-none">
        {item.hanja}
      </span>
      <div className="px-6 py-2 rounded-full bg-[#F8FAF9] dark:bg-slate-900 border-2 border-transparent" style={{ marginTop: '1.8rem' }}>
        <span className="font-normal text-xs uppercase tracking-[0.2em] text-[#AEB7C5]">{t('ext_1627')}</span>
      </div>
    </div>
  );
};

const DailyFlashcardBack = ({ item, onShowWords }) => {
  const { t } = useLang();
  return (
    <div
      className="daily-study-card flashcard-face-back flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="flex flex-col items-center text-center">
        <span className="daily-study-main-character font-normal tracking-normaler leading-none">
          {item.hanja}
        </span>
        <div className="daily-study-divider w-12 h-1 rounded-full bg-slate-300" />
        <div className="flex flex-row items-baseline gap-3">
          <span className="daily-study-meaning font-normal leading-none">
            {item.meaning}
          </span>
          <span className="daily-study-sound font-normal tracking-normaler leading-none">
            {item.sound}
          </span>
        </div>
      </div>
      {item.words?.length > 0 && (
        <div className="mt-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowWords();
            }}
            className="bg-[var(--color-bg-surface)] px-4 py-2 rounded-2xl border border-[#E9EDF2] shadow-sm active:scale-95 transition-all flex items-center gap-2"
          >
            <img src="/assets/images/icons/related_words.webp" className="w-8 h-8 object-contain" alt={t('ext_494')} />
            <span className="text-lg font-normal text-[#AEB7C5] uppercase tracking-wider">{t('ext_1372')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

const DailyFlashcardCard = ({ isFlipped, isTransitioning, item, onCardClick, onShowWords }) => (
  <div className={`relative w-full aspect-[5/6] transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
    <div className="w-full h-full cursor-pointer flashcard-perspective" onClick={onCardClick}>
      <div className={`relative w-full h-full flashcard-preserve-3d transition-all duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
        <DailyFlashcardFront item={item} />
        <DailyFlashcardBack item={item} onShowWords={onShowWords} />
      </div>
    </div>
  </div>
);

export default DailyFlashcardCard;