import { GRADES } from '../../../constants/hanjaConstants.js';
import { useLang } from '../../../hooks/useLang.js';
import { gradeLabel } from '../../../components/GradeGrid.jsx';

const GameGradeGrid = ({ onSelectGrade, selectedGrade, unlockedGrades }) => {
  const { t } = useLang();

  return (
    <div className="grid grid-cols-3 gap-3 w-full animate-in fade-in duration-500">
      {GRADES.map((grade) => {
        const isLocked = grade !== '전체' && !unlockedGrades.has(grade);
        const isSelected = selectedGrade === grade;

        return (
          <button
            key={grade}
            onClick={isLocked ? undefined : () => onSelectGrade(grade)}
            className={`relative py-4 rounded-3xl font-normal text-h3 transition-all border-4 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 ${
              isLocked
                ? 'bg-[#F8FAF9] dark:bg-slate-900 border-[#E9EDF2] text-slate-200 cursor-not-allowed'
                : isSelected
                  ? 'bg-[var(--color-bg-surface)] border-[#FF9B73] text-[color:var(--color-text-muted)] dark:text-slate-300 shadow-lg'
                  : 'bg-[var(--color-bg-surface)] border-[#E9EDF2] text-[color:var(--color-text-muted)] dark:text-slate-300 hover:border-[#E9EDF2]'
            }`}
          >
            {isLocked ? (
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-slate-200">
                <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 5a3 3 0 016 0v3H9V6zm3 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
              </svg>
            ) : (
              <>
                <span>{gradeLabel(grade, t)}</span>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-[#FF9B73] text-white rounded-full p-1 shadow-md">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-white stroke-[4]" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default GameGradeGrid;