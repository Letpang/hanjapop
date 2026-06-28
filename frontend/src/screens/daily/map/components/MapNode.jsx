import { getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import GameNodeButton from './GameNodeButton.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const CurrentCharacter = ({ charImg, charId }) => {
  const { t } = useLang();
  
  return (
    <div className="pointer-events-none absolute -top-[80px] left-1/2 z-50 -translate-x-1/2">
      <img
        src={charImg}
        alt={t('ext_981')}
        className="h-[80px] w-[80px] max-w-none origin-bottom object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)]"
        style={{ transform: `translateY(${getCharacterTranslateY(charId)})` }}
      />
    </div>
  );
};

const MapNode = ({ label, icon, isLeft, status, charImg, charId, onTap }) => {
  const isDone = status === 'done';
  const isCurrent = status === 'active';
  const isLocked = status === 'locked';

  return (
    <div
      className={`relative my-4 flex w-full flex-col items-center justify-center ${isLeft ? 'items-end pr-6' : 'items-start pl-6'}`}
      style={{ zIndex: 10 }}
    >
      <div className={`relative ${isCurrent ? 'float-active' : 'float-gentle'}`}>
        {isCurrent && charImg && <CurrentCharacter charImg={charImg} charId={charId} />}

        <div className={isCurrent ? 'node-pulse' : ''}>
          <button
            disabled={isLocked}
            onClick={isLocked ? undefined : onTap}
            className={`relative flex h-[clamp(140px,38vw,170px)] w-[clamp(140px,38vw,170px)] items-center justify-center bg-transparent transition-all duration-300 ${!isLocked ? 'active:scale-95 hover:scale-105' : ''}`}
          >
            <GameNodeButton status={status} icon={icon} />
            {isDone && (
              <div className="absolute -right-2 -top-2 z-30 flex h-9 w-9 rotate-12 transform items-center justify-center rounded-full border-2 border-white bg-[#FF9B73] text-xl font-normal text-white shadow-lg dark:border-slate-700">
                ✓
              </div>
            )}
          </button>
          {isDone && (
            <img
              src="/assets/images/icons/clay_star.webp"
              alt="star"
              className="absolute -right-4 -top-4 h-8 w-8 animate-pulse object-contain drop-shadow-[0_4px_8px_rgba(255,211,182,0.6)]"
              style={{ animationDelay: '0.2s' }}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center">
        <span className={`text-center text-[clamp(20px,5.5vw,26px)] font-normal leading-tight tracking-normal drop-shadow-sm ${isLocked ? 'text-[#94A3B8]' : 'text-[#334155] dark:text-slate-200'}`}>
          {label}
        </span>
      </div>
    </div>
  );
};

export default MapNode;