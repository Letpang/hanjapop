import { useLang } from '../../../../hooks/useLang.js';

const LevelTestIntro = ({
  onBack,
  onStart,
  questionCount,
  passThreshold,
  unlockedCount,
}) => {
  const { t } = useLang();

  return (
    <div className="quiz-screen quiz-screen--plain">
      <div className="quiz-header-wrap quiz-header-wrap--sm">
        <div className="quiz-header-card quiz-header-card--wide">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1 rounded-2xl border-2 border-white bg-white px-3 py-2 font-normal text-[color:var(--color-text-muted)] shadow-lg transition-all active:scale-95 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300"
          >
            ←
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
            <h2 className="m-0 text-lg font-medium text-slate-700 dark:text-slate-100">{t('ext_1592')}</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 pt-8">
        <div className="clay-panel flex w-full max-w-md flex-col items-center gap-6 rounded-[3.5rem] border-4 border-white bg-white p-6 text-center shadow-2xl sm:p-8 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col items-center gap-2">
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#FFB433]/15 bg-[#FFB433]/10 dark:border-[#8B5E00] dark:bg-[#FFB433]/20" />
            <h2 className="text-h2-res premium-text-shadow font-medium text-slate-700 dark:text-white">{t('ext_1592')}</h2>
            <p className="text-sm font-normal text-[#AEB7C5]">{t('ext_2361')}</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-[#C3C6FF]/50 bg-[#7C83FF]/10/50 p-5 dark:border-[#4A51D4] dark:bg-[#4A51D4]/30">
              <span className="text-h2-res mb-2">📋</span>
              <span className="mb-1 text-xs font-normal uppercase tracking-widest text-[#7C83FF]">{t('ext_1474')}</span>
              <span className="text-body-lg-res font-normal text-[color:var(--color-primary-blue)] dark:text-[#7C83FF]">{t('ext_2248', { questionCount })}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-[#FFB433]/15/50 bg-[#FFB433]/10/50 p-5 dark:border-[#8B5E00] dark:bg-[#FFB433]/30">
              <span className="mb-1 text-xs font-normal uppercase tracking-widest text-[#FFB433]">{t('ext_1591')}</span>
              <span className="text-body-lg-res font-normal text-[#FFB433] dark:text-[#FFB433]">{t('ext_2319', { passThreshold })}</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 text-left">
            <div className="flex items-center gap-4 rounded-2xl border-2 border-[#FF9B73]/20/50 bg-[#FF9B73]/10/50 px-5 py-4 dark:border-[#FF9B73]/30 dark:bg-[#FF9B73]/20/30">
              <span className="text-h3-res">🔓</span>
              <p className="text-sm font-normal leading-tight text-[color:var(--color-text-muted)] dark:text-[#AEB7C5]">
                {t('ext_2320')} <span className="font-normal text-[#FF9B73] dark:text-[#FF9B73]">{t('ext_1954')}</span>
              </p>
            </div>
          </div>

          {unlockedCount < 3 && (
            <p className="w-full rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-normal text-red-500 dark:border-red-800 dark:bg-red-900/20">
              {t('ext_2693')}
            </p>
          )}
        </div>

        <button
          onClick={onStart}
          disabled={unlockedCount < 3}
          className="text-h3 flex w-full max-w-md items-center justify-center gap-2 rounded-[2rem] py-5 font-normal text-white shadow-xl transition-all active:scale-95 disabled:bg-slate-300"
          style={{ background: '#7C83FF' }}
        >
          {t('ext_1373')}
        </button>
      </div>
    </div>
  );
};

export default LevelTestIntro;
