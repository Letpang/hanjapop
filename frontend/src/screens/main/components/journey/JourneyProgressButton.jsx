import { TOTAL_STAGES } from '../../constants.js';
import { useLang } from '../../../../hooks/useLang.js';

const JourneyProgressButton = ({
  ctaIsHot,
  isDarkMode,
  isJourneyComplete,
  currentDay,
  onPrimaryCta,
}) => {
  const { t } = useLang();
  const progressDay = isJourneyComplete ? TOTAL_STAGES : currentDay;
  const progressPercent = Math.round((progressDay / TOTAL_STAGES) * 100);
  const progressLabel = `${progressDay}/${TOTAL_STAGES}`;

  return (
    <button
      type="button"
      onClick={onPrimaryCta}
      className="w-full px-4 py-3 flex items-center gap-3 border-t active:scale-[0.98] transition-all"
      style={isDarkMode
        ? { background: ctaIsHot ? 'rgba(255,107,107,0.15)' : '#162033', borderColor: 'rgba(148,163,184,0.16)', borderRadius: 0 }
        : { background: ctaIsHot ? '#FFF1EA' : '#F4FBF9', borderColor: '#E7F1EE', borderRadius: 0 }}
    >
      <span className={`font-medium text-xs shrink-0 ${ctaIsHot ? 'text-[#FF6B6B]' : 'text-[#6D7D91]'}`}>
        {t('ext_2144')}
      </span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className={`flex-1 rounded-full overflow-hidden h-[8px] shadow-inner ${ctaIsHot ? 'bg-[#FFE0D4]' : 'bg-[#DDEBE8]'}`}>
          <div
            className="quiz-progress-fill"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg,#FF9B73,#FF6B6B)', boxShadow: '0 0 8px rgba(255,155,115,0.5)' }}
          />
        </div>
        <div className="flex items-center gap-1.5 pl-3 pr-2.5 py-1 rounded-xl shadow-sm shrink-0 bg-[#FFF1EA]/80 dark:bg-rose-950/30 border border-orange-100 dark:border-rose-900/40">
          <span className="font-normal text-base" style={{ color: '#FF6B6B', letterSpacing: 0 }}>
            {progressLabel}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-400/80" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default JourneyProgressButton;
