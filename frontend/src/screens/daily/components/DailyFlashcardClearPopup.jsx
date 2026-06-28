import CtaButton from '../../../components/common/CtaButton.jsx';
import RewardBreakdown from '../../../components/common/RewardBreakdown.jsx';
import { useLang } from '../../../hooks/useLang.js';

const DailyFlashcardClearPopup = ({ clearMsg, getRewardPreview, onStageClear }) => {
  const { t } = useLang();

  return (
    <div className="mobile-center-overlay fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300 overlay-success">
      <div className="mobile-modal-card w-full max-w-sm flex flex-col items-center rounded-[2.5rem] bg-[var(--color-bg-surface)] border-4 border-[var(--color-border-subtle)] shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2ED6C5] rounded-full blur-[80px] opacity-20 pointer-events-none" />

        <div className="pt-10 pb-8 px-7 flex flex-col items-center gap-7 w-full relative z-10">
          <div className="text-center flex flex-col gap-1 w-full">
            <span className="text-sm font-normal text-[#94A3B8]">{t('ext_2176')}</span>
            <h1 className="text-3xl font-medium leading-tight mt-1" style={{ color: '#FF9B73', letterSpacing: 0, textShadow: '0 2px 10px rgba(255,160,120,0.15)', whiteSpace: 'pre-line' }}>
              {t(clearMsg)}
            </h1>
          </div>

          <div className="w-full relative z-10 my-2 px-1">
            <div className="absolute top-[1.65rem] left-[10%] w-[80%] h-[6px] rounded-full bg-slate-100 shadow-inner" />
            <div className="absolute top-[1.65rem] left-[10%] w-[40%] h-[6px] rounded-full bg-gradient-to-r from-[#2ED6C5] to-[#0D9488] shadow-[0_0_8px_rgba(46,214,197,0.4)]" />

            <div className="flex items-start justify-between w-full relative">
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-[#E0F2FE] to-[#7DD3FC] shadow-md border-[3px] border-[var(--color-border-subtle)] flex items-center justify-center relative transform transition-transform hover:scale-105">
                  <img src="/assets/images/icons/study.webp" className="w-7 h-7 object-contain opacity-90 drop-shadow-sm" alt="Study" />
                  <div className="absolute -top-2 -right-2 bg-[#FF9B73] text-white w-5 h-5 rounded-full flex items-center justify-center text-base font-normal shadow-sm border border-[var(--color-border-subtle)]">✓</div>
                </div>
                <span className="text-base font-normal text-[#FF9B73]">{t('ext_1494')}</span>
              </div>

              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="absolute -top-7 text-xl animate-bounce drop-shadow-sm">📍</div>
                <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-[#A7F3D0] to-[#10B981] shadow-[0_8px_16px_rgba(16,185,129,0.3)] border-[3px] border-[var(--color-border-subtle)] flex items-center justify-center transform scale-110">
                  <img src="/assets/images/icons/sentence.webp" className="w-7 h-7 object-contain drop-shadow-md" alt="Quiz" />
                </div>
                <span className="text-base font-normal text-[#10B981] mt-0.5">{t('ext_977')}</span>
              </div>

              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-14 h-14 rounded-[1.2rem] bg-[#F1F5F9] shadow-inner border-[3px] border-[var(--color-border-subtle)] flex items-center justify-center grayscale opacity-50">
                  <img src="/assets/images/icons/monster.webp" className="w-7 h-7 object-contain" alt="Game" />
                </div>
                <span className="text-base font-normal text-[#94A3B8]">{t('ext_978')}</span>
              </div>
            </div>
          </div>

          <RewardBreakdown
            reward={getRewardPreview?.(30)}
            correctXp={30}
            clearXp={0}
            correctLabel={t('ext_477')}
            detailText=""
          />

          <div className="w-full mt-3">
            <CtaButton theme="coral" onClick={onStageClear}>
              <span className="font-normal text-white text-[1.5rem] drop-shadow-md">{t('ext_1747')}</span>
              <span className="text-white font-normal text-[1.5rem] drop-shadow-md">›</span>
            </CtaButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyFlashcardClearPopup;