import { useLang } from '../../../../hooks/useLang.js';

export const Toggle = ({ value, onToggle }) => {
  const { t } = useLang();
  return (
    <button
      onClick={onToggle}
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={t('ext_1490')}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-all duration-300 ${value ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
};

export const Row = ({ label, sub, children }) => {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-normal leading-tight text-slate-700 dark:text-slate-200">{label}</span>
        {sub && <span className="mt-0.5 text-xs font-normal leading-tight text-slate-400 dark:text-slate-500">{sub}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
};

export const Section = ({ title, color, children }) => {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-normal tracking-normal opacity-70" style={{ color }}>{title}</p>
      <div className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-slate-700/40 dark:bg-slate-800/80">
        {children}
      </div>
    </div>
  );
};

export const Divider = () => <div className="h-px bg-slate-100 dark:bg-slate-700/50" />;