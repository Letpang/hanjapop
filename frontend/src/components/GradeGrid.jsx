import { GRADES } from '../constants/hanjaConstants.js';
import { usePremium } from '../hooks/usePremium.js';
import { useLang } from '../hooks/useLang.js';
export { GRADES };

const GRADE_KEY_MAP = {
    '전체': 'ext_281', '8급': 'ext_270',
    '7급Ⅱ': 'ext_3201', '7급II': 'ext_1064', '7급': 'ext_271',
    '6급Ⅱ': 'ext_3202', '6급II': 'ext_1065', '6급': 'ext_272',
};
export const gradeLabel = (grade, t) => t(GRADE_KEY_MAP[grade] || grade);

// 급수별 선택 그리드 — 모든 화면 공용
const GradeGrid = ({ selected, onSelect, lockedGrades = [] }) => {
    const { isPremium, showPremiumGate } = usePremium();
    const { t } = useLang();
    return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-[1.4rem] w-full animate-in fade-in duration-500">
        {GRADES.map(g => {
            const locked = lockedGrades.includes(g);
            const isSel = selected === g;
            return (
                <button
                    key={g}
                    onClick={locked ? undefined : () => { if (!isPremium) { showPremiumGate(); return; } onSelect(g); }}
                    className={`relative h-[5.2rem] rounded-3xl font-normal text-h3 transition-all border-4 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 ${
                        locked 
                        ? 'bg-[#F8FAF9] dark:bg-slate-800/60 border-[#E9EDF2] dark:border-slate-700 text-slate-200 dark:text-slate-600 cursor-not-allowed'
                        : isSel
                            ? 'dm-selected-glow bg-white dark:bg-slate-800 border-[#FFA88D] text-[color:var(--color-text-muted)] dark:text-slate-100 shadow-lg'
                            : 'bg-white dark:bg-slate-800 border-[#E9EDF2] dark:border-slate-700 text-[color:var(--color-text-muted)] dark:text-slate-200 hover:border-[#E9EDF2] dark:hover:border-slate-600'
                    }`}
                >
                    {locked ? (
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-slate-200">
                            <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 5a3 3 0 016 0v3H9V6zm3 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                        </svg>
                    ) : (
                        <>
                            <span>{gradeLabel(g, t)}</span>
                            {isSel && (
                                <div className="absolute -top-2 -right-2 bg-[#FFA88D] text-white rounded-full p-1 shadow-md">
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

// 주제별 카드 — 모든 화면 공용
export const TopicCard = ({ name, isSelected, onClick, locked }) => {
    const { isPremium, showPremiumGate } = usePremium();
    const { t } = useLang();
    const handleClick = locked ? undefined : () => { if (!isPremium) { showPremiumGate(); return; } onClick?.(); };
    return (
    <button
        onClick={handleClick}
        className={`relative h-[5.2rem] rounded-3xl font-normal text-h3 transition-all border-4 flex items-center justify-center shadow-sm active:scale-95 px-2 ${
            locked
            ? 'bg-[#F8FAF9] dark:bg-slate-800/60 border-[#E9EDF2] dark:border-slate-700 text-slate-200 dark:text-slate-600 cursor-not-allowed'
            : isSelected
                ? 'dm-selected-glow bg-white dark:bg-slate-800 border-[#FFA88D] text-[color:var(--color-text-muted)] dark:text-slate-100 shadow-lg'
                : 'bg-white dark:bg-slate-800 border-[#E9EDF2] dark:border-slate-700 text-[color:var(--color-text-muted)] dark:text-slate-200 hover:border-[#E9EDF2] dark:hover:border-slate-600'
        }`}
    >
        {locked ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-slate-200">
                <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 5a3 3 0 016 0v3H9V6zm3 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
        ) : (
            <>
                <span className="text-center leading-tight break-keep">
                    {(() => {
                        const parts = name.split(' ');
                        if (parts.length > 2) {
                            return <>{parts.slice(0, -2).join(' ')}{' '}<span className="whitespace-nowrap">{parts.slice(-2).join(' ')}</span></>;
                        }
                        return name;
                    })()}
                </span>
                {isSelected && (
                     <div className="absolute -top-2 -right-2 bg-[#FFA88D] text-white rounded-full p-1 shadow-md">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-white stroke-[4]" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                )}
            </>
        )}
    </button>
    );
};

export default GradeGrid;