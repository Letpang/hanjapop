import { useLang } from '../../hooks/useLang.js';

const CharacterToastBubble = ({
  isMission,
  isRankSoon,
  isRankUp,
  isTypeB,
  message,
  nextRankAvatar,
  onAction,
  onDismiss,
}) => {
  const { t } = useLang();

  return (
    <div
      className="char-toast-bubble relative flex-1 rounded-[1.8rem] rounded-tl-none px-5 py-3.5 shadow-2xl transition-all duration-300 min-w-0 backdrop-blur-xl"
      style={{
        '--toast-bg': isRankUp ? 'rgba(30, 27, 75, 0.85)' : 'rgba(15, 23, 42, 0.85)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <p className="text-white font-normal text-base leading-snug break-keep whitespace-normal drop-shadow-md">{message}</p>

      {isRankSoon && isTypeB && nextRankAvatar && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border-2 border-[#A5B4FC] overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            <img src={nextRankAvatar} alt="next rank" className="w-full h-full object-contain p-0.5" />
          </div>
          <p className="text-base font-medium text-[#A5B4FC] drop-shadow-sm">{t('ext_1967')}</p>
        </div>
      )}

      {isMission && (
        <p className="text-[#FFB393] font-medium text-base mt-1 animate-pulse drop-shadow-sm">{t('ext_2089')}</p>
      )}
      {isRankUp && (
        <p className="text-[#FFB393] font-medium text-base mt-1 animate-pulse drop-shadow-sm">{t('ext_2090')}</p>
      )}
      {!isMission && !isRankSoon && !isRankUp && onAction && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-base font-normal text-slate-300 drop-shadow-sm">{t('ext_1545')}</p>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onAction();
              onDismiss();
            }}
            className="px-4 py-1.5 bg-gradient-to-r from-[#2ED6C5] to-[#26B2A4] text-white font-medium text-base rounded-full active:scale-95 transition-transform self-start shadow-lg shadow-[#2ED6C5]/30 hover:shadow-[#2ED6C5]/50"
          >
            {t('ext_2222')}
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterToastBubble;