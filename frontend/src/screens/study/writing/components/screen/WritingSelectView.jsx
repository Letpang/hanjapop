import GradeGrid, { TopicCard } from '../../../../../components/GradeGrid.jsx';
import { GRADES, CATEGORY_IMAGES, categoryLabel } from '../../../../../constants/hanjaConstants.js';
import HANJA_DATA from '../../../../../hanja_unified.json';
import { WRITING_CATEGORIES } from '../../writingScreenData.js';
import { useLang } from '../../../../../hooks/useLang.js';

const WritingSelectView = ({
  viewMode,
  setViewMode,
  gradeFilter,
  setGradeFilter,
  categoryFilter,
  setCategoryFilter,
  isPremium,
  showPremiumGate,
  unlockedGrades,
  unlockedIds,
  characterAvatar,
  onOpenList,
}) => {
  const { t } = useLang();

  return (
    <div className="flex w-full flex-col items-center animate-in fade-in duration-500">
      <div className="mb-4 flex w-full rounded-full border border-[#E9EDF2] bg-[#F4F7F8]/40 p-1.5 shadow-inner">
        <button
          onClick={() => setViewMode('grade')}
          className={`text-h3 flex-1 rounded-full px-8 py-3 font-normal transition-all ${viewMode === 'grade' ? 'bg-white text-[color:var(--color-text-muted)] shadow-md dark:bg-slate-800 dark:text-slate-300' : 'text-[#AEB7C5]'}`}
        >
          {t('ext_165')}
        </button>
        <button
          onClick={() => setViewMode('topic')}
          className={`text-h3 flex-1 rounded-full px-8 py-3 font-normal transition-all ${viewMode === 'topic' ? 'bg-white text-[color:var(--color-text-muted)] shadow-md dark:bg-slate-800 dark:text-slate-300' : 'text-[#AEB7C5]'}`}
        >
          {t('ext_780')}
        </button>
      </div>

      {viewMode === 'grade' ? (
        <GradeGrid
          selected={gradeFilter}
          onSelect={isPremium ? setGradeFilter : () => showPremiumGate()}
          lockedGrades={GRADES.filter(grade => grade !== '전체' && !unlockedGrades.has(grade))}
        />
      ) : (
        <div className="grid w-full grid-cols-2 gap-4">
          {WRITING_CATEGORIES.map(category => (
            <TopicCard
              key={category}
              name={categoryLabel(category, t)}
              imgSrc={CATEGORY_IMAGES[category] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[category]}` : null}
              count={`${HANJA_DATA.filter(hanja => hanja.category === category).length}${t('ext_231')}`}
              isSelected={categoryFilter === category}
              onClick={isPremium ? () => setCategoryFilter(category) : showPremiumGate}
              locked={!HANJA_DATA.some(hanja => hanja.category === category && unlockedIds.has(hanja.id))}
            />
          ))}
        </div>
      )}

      <div className="relative mb-5 mt-4 flex flex-col items-center">
        <div className="absolute left-[60%] top-4 z-20">
          <div className="quiz-bubble">
            <span className="text-body whitespace-nowrap break-keep font-normal text-[color:var(--color-text-muted)] dark:text-slate-300">{t('ext_1500')}</span>
            <div className="absolute -bottom-1.5 left-3 h-4 w-4 rotate-45 border-b border-r border-white bg-white dark:border-slate-700 dark:bg-slate-800" />
          </div>
        </div>
        <div className="relative z-10 mt-10 flex h-36 w-36 items-center justify-center">
          <img src={characterAvatar} className="h-full w-full object-contain drop-shadow-2xl" alt="avatar" />
        </div>
        <div className="-mt-6 h-4 w-40 scale-x-125 rounded-[100%] bg-slate-400/20 blur-lg" />
      </div>

      <div className="-mt-2.5 w-full max-w-sm px-4 pb-4">
        <button
          onClick={onOpenList}
          className="text-h3 flex w-full items-center justify-center gap-3 rounded-[2rem] py-5 font-normal text-white shadow-xl transition-all active:translate-y-1 active:scale-95 active:shadow-none"
          style={{ backgroundColor: '#FF9B73', borderBottom: '6px solid #E0735A' }}
        >
          <span>{t('ext_1739')}</span>
        </button>
      </div>
    </div>
  );
};

export default WritingSelectView;