import HANJA_DATA from '../../../../hanja_unified.json';
import GradeGrid, { TopicCard } from '../../../../components/GradeGrid.jsx';
import { GRADES, CATEGORY_IMAGES, categoryLabel } from '../../../../constants/hanjaConstants.js';
import { useLang } from '../../../../hooks/useLang.js';

const SentenceQuizSetupView = ({
    viewMode,
    selectedGrade,
    selectedCategory,
    categories,
    characterAvatar,
    unlockedGrades,
    unlockedIds,
    onViewModeChange,
    onGradeSelect,
    onCategorySelect,
    onStart,
}) => {
    const { t } = useLang();

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in duration-500">
            <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-4 shadow-inner">
                <button onClick={() => onViewModeChange('grade')}
                    className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'grade' ? 'bg-[var(--color-bg-surface)] shadow-md text-[color:var(--color-text-muted)] dark:text-slate-300' : 'text-[#AEB7C5]'}`}>
                    {t('ext_2417')}
                </button>
                <button onClick={() => onViewModeChange('topic')}
                    className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'topic' ? 'bg-[var(--color-bg-surface)] shadow-md text-[color:var(--color-text-muted)] dark:text-slate-300' : 'text-[#AEB7C5]'}`}>
                    {t('ext_2418')}
                </button>
            </div>
            {viewMode === 'grade' && (
                <GradeGrid
                    selected={selectedGrade}
                    onSelect={onGradeSelect}
                    lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))}
                />
            )}
            {viewMode === 'topic' && (
                <div className="grid grid-cols-2 gap-4 w-full">
                    {categories.map(cat => (
                        <TopicCard
                            key={cat}
                            name={categoryLabel(cat, t)}
                            imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                            count={`${HANJA_DATA.filter(h => h.category === cat).length}${t('ext_231')}`}
                            isSelected={selectedCategory === cat}
                            onClick={() => onCategorySelect(cat)}
                            locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))}
                        />
                    ))}
                </div>
            )}
            <div className="flex flex-col items-center mt-4 mb-5 relative">
                <div className="absolute top-4 left-[60%] z-20">
                    <div className="px-5 py-2 rounded-2xl shadow-xl border border-[var(--color-border-subtle)] relative bg-[var(--color-bg-surface)]/90 backdrop-blur-md">
                        <span className="text-body font-normal text-[color:var(--color-text-muted)] dark:text-slate-300 whitespace-nowrap break-keep">{t('ext_1500')}</span>
                        <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-[var(--color-bg-surface)] border-r border-b border-[var(--color-border-subtle)]" />
                    </div>
                </div>
                <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
                    <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                </div>
                <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
            </div>
            <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                <button
                    onClick={onStart}
                    className="w-full py-5 rounded-[2rem] font-normal text-h3 text-white transition-all active:scale-95 shadow-[0_8px_24px_rgba(255,168,141,0.35)] flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                    style={{ background: 'linear-gradient(135deg,#FFA88D 0%,#FF8D72 100%)', borderBottom: '6px solid #E0735A' }}
                >
                    <span>{t('ext_1604')}</span>
                </button>
            </div>
        </div>
    );
};

export default SentenceQuizSetupView;