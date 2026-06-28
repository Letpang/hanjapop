import { ResultModalActions } from '../../../../components/common/ResultModalShell.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const DailyResultActions = ({
  onComplete,
  onContinueNext,
  onShare,
  mainButtonSubtitle,
  nextStageLabel,
  shareStatus,
}) => {
  const { t, lang } = useLang();
  const isKorean = lang === 'ko';

  return (
    <ResultModalActions className="gap-2">
      <button
        type="button"
        onClick={onComplete}
        className="h-[76px] w-full rounded-[1.15rem] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1.5 py-2 px-3"
        style={{ background: 'linear-gradient(135deg, #FFB393 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.22)' }}
      >
        <span className="text-[1.45rem] font-bold text-white leading-none drop-shadow-sm flex items-center gap-1.5">
          {t('ext_1497')}
          <span aria-hidden="true">&gt;</span>
        </span>
        <span className="text-[1rem] font-normal text-white/90 text-center leading-tight break-keep">{mainButtonSubtitle}</span>
      </button>

      <div className={`grid gap-2 w-full items-stretch ${isKorean ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          type="button"
          onClick={onContinueNext}
          className="h-[76px] w-full rounded-[1.05rem] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1.5 py-2 px-2 shadow-[0_4px_12px_rgba(0,191,166,0.22)]"
          style={{ background: 'linear-gradient(135deg, #42E3D0 0%, #00BFA6 100%)' }}
        >
          <span className="text-[1.35rem] font-bold text-white leading-none drop-shadow-sm flex items-center gap-1.5">
            {nextStageLabel}
            <span aria-hidden="true">&gt;</span>
          </span>
          <span className="text-[1rem] font-normal text-white/90 text-center leading-tight">{t('ext_1577')}</span>
        </button>

        {isKorean && (
          <button
            type="button"
            onClick={onShare}
            className="h-[76px] w-full rounded-[1.05rem] bg-[#FEE500] shadow-[0_5px_14px_rgba(120,96,0,0.14)] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1.5 py-2 px-2"
          >
            <span className="text-[1.25rem] font-semibold text-[#3D2C04] leading-none flex items-center gap-1.5">
              {t('ext_1578')}
              <span aria-hidden="true">&gt;</span>
            </span>
            <span className="text-[1rem] font-medium text-[#8A6A12] text-center leading-tight break-keep">
              {t('ext_3813')}
            </span>
          </button>
        )}
      </div>

      {shareStatus && <p className="text-center text-base text-slate-400 -mt-1.5">{shareStatus}</p>}
    </ResultModalActions>
  );
};

export default DailyResultActions;
