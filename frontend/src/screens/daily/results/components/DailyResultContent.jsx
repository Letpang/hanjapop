import { ResultModalHeading } from '../../../../components/common/ResultModalShell.jsx';
import DailyHanjaReview from './DailyHanjaReview.jsx';
import DailyResultActions from './DailyResultActions.jsx';
import DailyResultConfetti from './DailyResultConfetti.jsx';
import DailyResultHero from './DailyResultHero.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const DailyResultContent = ({
  charImg,
  clearMsg,
  dayNumber,
  handleDailyShare,
  missionDone,
  missionTotal,
  onComplete,
  onContinueNext,
  referralActivatedCount,
  referralShareSubtitle,
  resultCharacterScale,
  resultCharacterTranslateY,
  shareStatus,
  todayHanja,
  mainButtonSubtitle,
  nextStageLabel,
}) => {
  const { t } = useLang();

  return (
    <div className="w-full flex flex-col items-center relative">
      <div
        className="absolute top-[-50px] w-[240px] h-[240px] rounded-full blur-[80px] opacity-25 z-0"
        style={{ backgroundColor: '#2ED6C5' }}
      />
      <DailyResultConfetti />

      <div className="pt-3 pb-4 px-0 flex flex-col items-center gap-6 w-full relative z-10">
        <DailyResultHero
          charImg={charImg}
          translateY={resultCharacterTranslateY}
          scale={resultCharacterScale}
          todayHanja={todayHanja}
        />

        <div className="w-full mt-10">
          <ResultModalHeading
            id="daily-result-title"
            kicker={null}
            title={(
              <div className="w-full text-center leading-tight tracking-tight px-2">
                <p className="text-[clamp(1.35rem,4.6vw,1.75rem)] font-normal text-slate-500 leading-snug">
                  {(() => {
                    const translation = t('ext_2511', { dayNumber: '##SPLIT##' });
                    const parts = translation.split('##SPLIT##');
                    let suffix = parts[1] || '';
                    let hasDange = false;
                    if (suffix.startsWith('단계')) {
                      suffix = suffix.substring(2);
                      hasDange = true;
                    }
                    return (
                      <>
                        {parts[0]}
                        <span className="text-[#FF6B6B] font-semibold">
                          {dayNumber}{hasDange ? '단계' : ''}
                        </span>
                        {suffix}
                      </>
                    );
                  })()}
                </p>
                <p className="text-[clamp(1.5rem,5vw,1.9rem)] text-amber-400 font-normal mt-1">+200 XP</p>
              </div>
            )}
            description={null}
          />
        </div>

        <div className="w-full mt-14">
          <DailyResultActions
            onComplete={onComplete}
            onContinueNext={onContinueNext}
            onShare={handleDailyShare}
            mainButtonSubtitle={mainButtonSubtitle}
            nextStageLabel={nextStageLabel}
            referralActivatedCount={referralActivatedCount}
            referralShareSubtitle={referralShareSubtitle}
            shareStatus={shareStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default DailyResultContent;
