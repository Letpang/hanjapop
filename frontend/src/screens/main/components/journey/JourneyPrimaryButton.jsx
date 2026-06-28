import CtaButton from '../../../../components/common/CtaButton.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const getPrimaryTitle = ({
  selectedPastStage,
  isStageLocked,
  isJourneyComplete,
  journeyRound,
  isDailyComplete,
  targetStage,
  t
}) => {
  if (selectedPastStage) {
    return isStageLocked
      ? t('ext_2682', { selectedPastStage })
      : t('ext_2581', { selectedPastStage });
  }
  if (isJourneyComplete) return t('ext_2552', { nextRound: journeyRound + 1 });
  if (isDailyComplete) return t('ext_1780');
  if (isStageLocked) return t('ext_2553', { targetStage });
  return t('ext_1781');
};

const getPrimarySubtitle = ({ isJourneyComplete, isDailyComplete, isStageLocked, t }) => {
  if (isJourneyComplete) return t('ext_2018');
  if (isDailyComplete) return t('ext_1956');
  if (isStageLocked) return t('ext_2212');
  return t('ext_1894');
};

const JourneyPrimaryButton = ({
  ctaIsHot,
  isDarkMode,
  isStageLocked,
  isDailyComplete,
  selectedPastStage,
  isJourneyComplete,
  journeyRound,
  targetStage,
  onPrimaryCta,
}) => {
  const { t } = useLang();

  return (
    <CtaButton
      theme={ctaIsHot ? 'coral' : 'cream'}
      onClick={onPrimaryCta}
      className="mm-primary-cta relative overflow-hidden"
      style={isDarkMode
        ? { borderRadius: 0, background: ctaIsHot ? undefined : 'linear-gradient(135deg, #1F2937 0%, #253244 100%)' }
        : { borderRadius: 0, background: ctaIsHot ? undefined : 'linear-gradient(135deg, #FFFDF9 0%, #FFF3EA 100%)' }}
    >
      {isDailyComplete && (
        <span
          className="absolute inset-y-0 left-0 w-24 bg-white/30 pointer-events-none"
          style={{ animation: 'mm-cta-shine 2.6s ease-in-out infinite' }}
        />
      )}
      {isDailyComplete && (
        <span className="absolute right-[5.5rem] top-5 text-[#FFE7A8] text-[18px] pointer-events-none" style={{ animation: 'mm-sparkle 1.8s ease-in-out infinite' }}>✦</span>
      )}
      <div className="w-full flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-4">
          <div className="text-left">
            <div className={`mm-primary-cta-title font-normal leading-tight ${ctaIsHot ? 'text-white drop-shadow-md' : 'text-[color:var(--color-text-muted)]'}`}>
              {getPrimaryTitle({ selectedPastStage, isStageLocked, isJourneyComplete, journeyRound, isDailyComplete, targetStage, t })}
            </div>
            <div
              className={`mm-primary-cta-subtitle mt-0.5 font-normal ${ctaIsHot ? 'text-white' : 'text-[#FF9B73]'}`}
            >
              {getPrimarySubtitle({ isJourneyComplete, isDailyComplete, isStageLocked, t })}
            </div>
          </div>
        </div>
        <div
          className={`shrink-0 flex items-center justify-center rounded-full w-9 h-9 shadow-md relative ${ctaIsHot ? 'bg-white text-[#FF6B6B]' : 'bg-[#FF9B73] text-white'}`}
          style={isDailyComplete ? { boxShadow: '0 8px 18px rgba(255,255,255,0.35), 0 0 0 6px rgba(255,255,255,0.16)' } : undefined}
        >
          {isStageLocked ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
              className="w-[18px] h-[18px]">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          ) : (
            <span className="mm-primary-cta-arrow font-normal">▶</span>
          )}
        </div>
      </div>
    </CtaButton>
  );
};

export default JourneyPrimaryButton;
