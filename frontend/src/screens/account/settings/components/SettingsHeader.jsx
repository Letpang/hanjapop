import { useLang } from '../../../../hooks/useLang.js';

const SettingsHeader = ({ onBack }) => {
  const { t } = useLang();

  return (
    <div
      className="sticky top-0 z-50 flex w-full items-center gap-3 border-b border-slate-100 bg-white/90 px-4 pb-4 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <button
        onClick={onBack}
        aria-label={t('ext_1485')}
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 transition-all active:scale-90 dark:bg-slate-800"
      >
        <span className="text-base font-normal text-slate-500 dark:text-slate-300">←</span>
      </button>
      <h1 className="text-xl font-medium tracking-normal text-slate-800 dark:text-slate-100">{t('ext_908')}</h1>
    </div>
  );
};

export default SettingsHeader;