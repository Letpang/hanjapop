import { useLang } from '../../../../../hooks/useLang.js';

const LoggedInAccount = ({ user, onLogout, isLoggingOut, logoutMessage }) => {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-normal leading-tight text-slate-700 dark:text-slate-200">{user.email || t('ext_1369')}</span>
          <span className="mt-0.5 text-xs font-normal leading-tight text-slate-400 dark:text-slate-500">
            {t('ext_2407')}
          </span>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="shrink-0 rounded-xl bg-slate-100 px-4 py-2 text-sm font-normal text-slate-500 transition-all active:scale-95 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-300"
          >
            {isLoggingOut ? t('ext_1702') : t('ext_1370')}
          </button>
        )}
      </div>
      {logoutMessage && <p className="text-right text-xs text-rose-500">{logoutMessage}</p>}
    </div>
  );
};

export default LoggedInAccount;
