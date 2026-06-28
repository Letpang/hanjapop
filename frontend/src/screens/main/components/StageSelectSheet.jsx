import GradeSelectChips from './stage-select/GradeSelectChips.jsx';
import PremiumReviewButton from './stage-select/PremiumReviewButton.jsx';
import StageGrid from './stage-select/StageGrid.jsx';
import StageSelectHeader from './stage-select/StageSelectHeader.jsx';
import { useLang } from '../../../hooks/useLang.js';

const StageSelectSheet = ({
  isOpen,
  isDarkMode,
  selectedPastStage,
  selectedGrade,
  archivedCompletedDay,
  showPremiumGate,
  canAccessStage,
  onSelectPastStage,
  onSelectGrade,
  onClose,
}) => {
  const { t } = useLang();

  if (!isOpen) return null;

  const clearSelection = () => {
    if (selectedPastStage) onSelectPastStage(null);
    if (selectedGrade) onSelectGrade(null);
    onClose();
  };

  const openPremiumReview = () => {
    onClose();
    showPremiumGate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="mobile-bottom-sheet w-full max-w-lg flex flex-col p-6 pb-10 gap-6 shadow-2xl"
        style={{ background: 'var(--color-bg-base)', borderRadius: '2rem 2rem 0 0' }}
        onClick={(event) => event.stopPropagation()}
      >
        <StageSelectHeader onClose={onClose} />
        <PremiumReviewButton onClick={openPremiumReview} />
        <GradeSelectChips
          selectedGrade={selectedGrade}
          canAccessStage={canAccessStage}
          showPremiumGate={showPremiumGate}
          onSelectGrade={onSelectGrade}
          onClose={onClose}
        />
        <StageGrid
          archivedCompletedDay={archivedCompletedDay}
          selectedPastStage={selectedPastStage}
          canAccessStage={canAccessStage}
          showPremiumGate={showPremiumGate}
          onSelectPastStage={onSelectPastStage}
          onClose={onClose}
        />

        {(selectedPastStage || selectedGrade) && (
          <button
            onClick={clearSelection}
            className="w-full py-3.5 mt-2 rounded-2xl border border-slate-200 text-slate-500 font-normal text-base hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            {t('ext_2653')}
          </button>
        )}
      </div>
    </div>
  );
};

export default StageSelectSheet;