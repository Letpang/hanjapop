import { useLang } from '../../../../../hooks/useLang.js';

const LoggedOutAccount = ({ onLogin }) => {
  const { t } = useLang();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-normal leading-tight text-slate-700 dark:text-slate-200">
          {t('ext_2744')}
        </span>
      </div>
      {onLogin && (
        <button
          onClick={onLogin}
          className="shrink-0 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-normal text-white shadow-md transition-all active:scale-95"
        >
          {t('ext_1918')}
        </button>
      )}
    </div>
  );
};

export default LoggedOutAccount;