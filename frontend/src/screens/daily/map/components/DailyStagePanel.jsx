import { useLang } from '../../../../hooks/useLang.js';

const HanjaPreviewCard = ({ hanja }) => (
  <div
    className="daily-stage-hanja flex flex-1 flex-col items-center rounded-[1.3rem] px-2 py-4"
    style={{
      background: 'rgba(255,255,255,0.70)',
      border: '1px solid rgba(46,214,197,0.18)',
      boxShadow: '0 2px 8px rgba(46,214,197,0.08)',
    }}
  >
    <img
      src={`/assets/images/hanja_all/${hanja.id}_${encodeURIComponent(hanja.hanja)}.webp`}
      onError={event => {
        event.target.src = '/assets/images/hanja_placeholder.webp';
      }}
      className="h-20 w-20 object-contain mix-blend-multiply dark:mix-blend-normal"
      alt={hanja.hanja}
    />
    <span className="mt-2 text-[42px] font-normal leading-none text-[#334155] dark:text-slate-200">{hanja.hanja}</span>
  </div>
);

const DailyStagePanel = ({ dayNumber, theme, todayHanja }) => {
  const { t } = useLang();

  return (
    <div
      className="daily-stage-panel mt-1 w-full max-w-sm rounded-[2rem] border border-white px-4 pb-5 pt-5 dark:border-slate-700/60"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 8px 32px rgba(46,214,197,0.10), 0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div className="mb-4 flex flex-col items-center gap-1">
        <h1 className="bg-gradient-to-r from-[#2ED6C5] to-[#0D9488] bg-clip-text pb-1 font-medium leading-none tracking-normal text-transparent text-[2rem]">
          {t('ext_2745', { dayNumber })}
        </h1>
        {theme && <p className="gradient-text-coral">{theme}</p>}
      </div>

      {todayHanja.length > 0 && (
        <div className="flex w-full flex-col gap-3">
          <p
            className="daily-stage-caption text-center font-normal"
          >
            {t('ext_2704')}
          </p>
          <div className="flex w-full gap-3">
            {todayHanja.map(hanja => <HanjaPreviewCard key={hanja.id ?? hanja.hanja} hanja={hanja} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyStagePanel;