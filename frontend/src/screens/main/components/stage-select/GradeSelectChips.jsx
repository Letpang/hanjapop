import { GRADES } from '../../constants.js';
import LockIcon from './LockIcon.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeSelectChips = ({
  selectedGrade,
  canAccessStage,
  showPremiumGate,
  onSelectGrade,
  onClose,
}) => {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-normal text-slate-400 tracking-wide">{t('ext_1594')}</p>
      <div className="flex flex-wrap gap-2">
        {GRADES.map(({ label, firstStage, color }) => {
          const locked = !canAccessStage(firstStage);
          const selected = selectedGrade === label;

          return (
            <button
              key={label}
              onClick={() => {
                if (locked) {
                  showPremiumGate();
                  return;
                }
                onSelectGrade(selected ? null : label);
                onClose();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-[14px] transition-all duration-300 active:scale-95 border group relative overflow-hidden ${
                selected
                  ? 'text-white shadow-lg border-transparent'
                  : locked
                    ? 'bg-gradient-to-tr from-[#F8FAFC] to-[#F1F5F9] border-slate-200 text-slate-500 shadow-sm'
                    : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700'
              }`}
              style={{
                background: selected ? color : locked ? 'linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%)' : '',
                borderColor: locked ? '#EDE9FE' : selected ? color : '',
              }}
            >
              {locked && <LockIcon />}
              <span className={`font-normal text-base tracking-normal ${locked ? 'text-[#6D28D9]/70' : ''}`}>{label}</span>
              {locked && (
                <span className="ml-1 text-base font-normal tracking-widest text-[#8B5CF6] bg-[#EDE9FE] px-1.5 py-0.5 rounded-md">
                  {t('ext_493')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GradeSelectChips;
