import { Divider, Section } from './SettingsPrimitives.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const DataActionButton = ({ children, className, ...props }) => (
  <button
    className={`w-full rounded-2xl py-3.5 text-sm font-normal transition-all active:scale-95 disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const DataSection = ({
  restoreFromCloud,
  isRestoring,
  restoreMsg,
  onRestore,
  onActivateTestPack,
  packActivated,
  onResetPack,
  packResetDone,
  onShowResetConfirm,
}) => {
  const { t } = useLang();

  return (
    <Section title={t('ext_974')} color="#94A3B8">
      {restoreFromCloud && (
        <>
          <DataActionButton
            onClick={onRestore}
            disabled={isRestoring}
            className="border border-indigo-100 bg-indigo-50 text-indigo-500 dark:border-indigo-800/30 dark:bg-indigo-900/20"
          >
            {isRestoring ? t('ext_1624') : t('ext_1813')}
          </DataActionButton>
          {restoreMsg && (
            <p className="-mt-2 text-center text-xs font-normal text-slate-400 dark:text-slate-500">{restoreMsg}</p>
          )}
          <Divider />
        </>
      )}

      {onActivateTestPack && (
        <>
          <DataActionButton
            onClick={onActivateTestPack}
            className="border border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-800/30 dark:bg-teal-900/20 dark:text-teal-400"
          >
            {packActivated ? t('ext_1917') : t('ext_1990')}
          </DataActionButton>
          <Divider />
        </>
      )}

      {onResetPack && (
        <>
          <DataActionButton
            onClick={onResetPack}
            className="border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400"
          >
            {packResetDone ? t('ext_1991') : t('ext_2048')}
          </DataActionButton>
          <Divider />
        </>
      )}

      <DataActionButton
        onClick={onShowResetConfirm}
        className="border border-rose-100 bg-rose-50 text-rose-500 dark:border-rose-800/30 dark:bg-rose-900/20"
      >
        {t('ext_2049')}
      </DataActionButton>
    </Section>
  );
};

export default DataSection;