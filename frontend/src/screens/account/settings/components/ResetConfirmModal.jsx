import { getCharacterScale } from '../../../../utils/rankUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const ResetConfirmModal = ({ isOpen, onCancel }) => {
  const { t } = useLang();

  if (!isOpen) return null;

  return (
    <div className="mobile-center-overlay fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-md">
      <div className="mobile-modal-card clay-panel flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-white p-8 text-center shadow-xl dark:bg-slate-800">
        <div className="mx-auto h-16 w-16">
          <img
            src="/assets/images/characters/garae/rank_5.webp"
            className="h-full w-full object-contain"
            alt=""
            style={{ transform: `scale(${getCharacterScale('garae', 'rank5')})` }}
          />
        </div>
        <div>
          <h3 className="mb-1 text-xl font-medium text-slate-800 dark:text-slate-100">{t('ext_1861')}</h3>
          <p className="text-sm font-normal text-slate-400">{t('ext_2175')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              window.localStorage.clear();
              window.location.reload();
            }}
            className="flex-1 rounded-2xl border border-rose-600 bg-rose-500 py-3 font-normal text-white shadow-md transition-all active:scale-95"
          >
            {t('ext_2278')}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-slate-100 py-3 font-normal text-slate-500 transition-all active:scale-95 dark:bg-slate-700 dark:text-slate-300"
          >
            {t('ext_2115')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmModal;