import CtaButton from '../CtaButton.jsx';
import RewardBreakdown from '../RewardBreakdown.jsx';
import { useLang } from '../../../hooks/useLang.js';

const DailyQuizResultOverlay = ({
  clearTitle,
  clearXp,
  correctXp,
  dailyMapNode,
  defaultFailTitle,
  detailText,
  failTitle,
  isClear,
  missionXp,
  onBack,
  onNextStage,
  reward,
  scoreNode,
  subtitle,
}) => {
  const { t } = useLang();

  return (
    <div className={`daily-session-result-backdrop${isClear ? '' : ' daily-session-result-backdrop--fail'}`}>
      <div className="mobile-modal-card w-full max-w-sm flex flex-col items-center rounded-[2.5rem] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative animate-in zoom-in-95 duration-200">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2ED6C5] dark:bg-[#14b8a6] rounded-full blur-[80px] opacity-20 dark:opacity-10 pointer-events-none" />
        <div className="pt-10 pb-8 px-7 flex flex-col items-center gap-6 w-full relative z-10">
          <div className="text-center flex flex-col gap-1 w-full">
            <span className="result-subtitle">{subtitle}</span>
            <h1 className={`text-3xl leading-tight mt-1 result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
              {isClear ? clearTitle : (failTitle || defaultFailTitle)}
            </h1>
            {scoreNode && (
              <p className="body-muted break-keep mt-2">{scoreNode}</p>
            )}
          </div>
          <div className="w-full">{dailyMapNode}</div>
          <RewardBreakdown
            reward={reward}
            correctXp={correctXp}
            clearXp={clearXp}
            detailText={detailText}
            missionXp={missionXp}
          />
          <div className="w-full mt-3">
            <CtaButton theme="coral" onClick={onNextStage || onBack}>
              <span className="quiz-cta-text">{t('ext_1747')}</span>
              <span className="quiz-cta-text ml-2">›</span>
            </CtaButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyQuizResultOverlay;