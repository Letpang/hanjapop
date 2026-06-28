import { INTRO_SLIDES } from '../onboardingData.js';
import { useLang } from '../../../hooks/useLang.js';

const OnboardingIntroActions = ({ onNext, onSkip, slideIdx }) => {
  const { t } = useLang();

  return (
    <>
      <div className="flex items-center gap-2">
        {INTRO_SLIDES.map((_, index) => (
          <div
            key={index}
            className={`rounded-full transition-all duration-300 ${index === slideIdx ? 'w-7 h-2 bg-[#00C7AE]' : 'w-2 h-2 bg-[#C8D8E4]/80 dark:bg-slate-600'}`}
            style={index === slideIdx ? { boxShadow: '0 0 8px rgba(0,199,174,0.55)' } : {}}
          />
        ))}
      </div>

      <button
        onClick={onNext}
        className="hp-cta-button hp-cta-button--teal onboarding-shimmer-btn text-h3 tracking-normal"
      >
        {slideIdx < INTRO_SLIDES.length - 1 ? t('ext_279') : t('ext_1643')}
      </button>

      <div className="w-full flex flex-col items-center gap-1.5">
        <p className="text-base font-normal text-[#888]">{t('ext_1723')}</p>
        <button
          onClick={onSkip}
          className="w-full rounded-[1.4rem] border-2 border-[#E5ECF3] dark:border-slate-700 bg-white/70 dark:bg-slate-800 py-3.5 text-body font-normal text-[#7A8798] dark:text-slate-300 active:scale-95"
        >
          {t('ext_2322')}
        </button>
      </div>
    </>
  );
};

export default OnboardingIntroActions;