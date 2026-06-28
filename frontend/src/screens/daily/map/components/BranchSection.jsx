import { getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import BranchOption from './BranchOption.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const getBranchStatus = ({ id, available, chosen, stepDone }) => {
  if (!available) return 'locked';
  if (stepDone) return chosen === id ? 'done' : 'faded';
  return 'active';
};

const BranchCharacter = ({ charImg, charId }) => (
  <div className="pointer-events-none absolute -top-[70px] left-1/2 z-50 -translate-x-1/2">
    <img
      src={charImg}
      alt={t('ext_981')}
      className="h-[80px] w-[80px] max-w-none origin-bottom animate-bounce object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)]"
      style={{ transform: `translateY(${getCharacterTranslateY(charId)})` }}
    />
  </div>
);

const BranchSection = ({ leftNode, rightNode, available, chosen, stepDone, charImg, charId, onTap }) => {
  const { t } = useLang();
  const isCurrent = available && !stepDone;

  return (
    <div className="relative my-6 flex w-full flex-col items-center" style={{ zIndex: 10 }}>
      {isCurrent && charImg && <BranchCharacter charImg={charImg} charId={charId} />}

      {isCurrent && (
        <div className="mb-4 rounded-full border border-white bg-white px-4 py-1.5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <span className="text-base font-normal text-[color:var(--color-text-muted)] dark:text-slate-300">{t('ext_1922')}</span>
        </div>
      )}

      <div className="relative flex w-full items-center justify-center gap-4 sm:gap-8">
        <div className={`relative z-10 ${isCurrent ? 'float-gentle' : ''}`} style={{ animationDelay: '0s' }}>
          <BranchOption
            node={leftNode}
            status={getBranchStatus({ id: leftNode.id, available, chosen, stepDone })}
            onTap={onTap}
          />
        </div>

        <div className={`z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCurrent ? 'border-2 border-slate-100 bg-white shadow-md dark:bg-slate-800' : 'opacity-0'}`}>
          <span className="text-base font-normal text-[#94A3B8]">VS</span>
        </div>

        <div className={`relative z-10 ${isCurrent ? 'float-active' : ''}`} style={{ animationDelay: '0.5s' }}>
          <BranchOption
            node={rightNode}
            status={getBranchStatus({ id: rightNode.id, available, chosen, stepDone })}
            onTap={onTap}
          />
        </div>
      </div>
    </div>
  );
};

export default BranchSection;