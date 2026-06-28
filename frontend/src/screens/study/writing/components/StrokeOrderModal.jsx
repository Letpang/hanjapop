import { useLang } from '../../../../hooks/useLang.js';

const StrokeOrderModal = ({ hanja, strokeOrderSvg, strokeOrderKey, onReplay, onClose }) => {
  const { t } = useLang();

  if (!strokeOrderSvg) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg-surface)] rounded-[2rem] p-6 flex flex-col items-center gap-4 shadow-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[color:var(--color-text-muted)] dark:text-slate-300 font-normal text-base">
          {t('ext_2966', {
            hanja: hanja?.hanja ?? '',
            meaning: hanja?.meaning ?? '',
            sound: hanja?.sound ?? '',
          })}
        </p>
        <div
          key={strokeOrderKey}
          className="w-[260px] h-[260px]"
          dangerouslySetInnerHTML={{ __html: strokeOrderSvg }}
        />
        <div className="flex gap-3 w-full">
          <button
            onClick={onReplay}
            className="flex-1 py-3 rounded-2xl bg-[#F0F2F5] text-[color:var(--color-text-muted)] dark:text-slate-300 font-normal text-base"
          >
            {t('ext_1544')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-[#7C83FF] text-white font-normal text-base"
          >
            {t('ext_470')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrokeOrderModal;
