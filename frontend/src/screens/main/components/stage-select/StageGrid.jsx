import LockIcon from './LockIcon.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const StageGrid = ({
  archivedCompletedDay,
  selectedPastStage,
  canAccessStage,
  showPremiumGate,
  onSelectPastStage,
  onClose,
}) => {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-normal text-slate-400 tracking-wide">{t('ext_1595')}</p>
      <div className="grid grid-cols-5 gap-2.5 overflow-y-auto pr-1 pb-2" style={{ maxHeight: '35vh' }}>
        {Array.from({ length: Math.max(0, archivedCompletedDay) }, (_, i) => i + 1).map((stage) => {
          const selected = selectedPastStage === stage;
          const locked = !canAccessStage(stage);

          return (
            <button
              key={stage}
              onClick={() => {
                if (locked) {
                  showPremiumGate();
                  return;
                }
                onSelectPastStage(stage);
                onClose();
              }}
              className={`aspect-square rounded-[18px] flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-95 border relative group ${
                selected
                  ? 'bg-[#2ED6C5] border-[#2ED6C5] text-white shadow-lg'
                  : locked
                    ? 'shadow-sm border-[#EDE9FE]'
                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
              }`}
              style={{
                background: locked ? 'linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%)' : selected ? '' : '',
              }}
            >
              {locked && (
                <div className="absolute top-2 right-2">
                  <LockIcon className="w-3.5 h-3.5 text-[#A78BFA] drop-shadow-sm" />
                </div>
              )}
              <span className={`text-[17px] font-normal leading-none ${locked ? 'text-[#6D28D9]/70' : ''} transition-colors`}>{stage}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StageGrid;