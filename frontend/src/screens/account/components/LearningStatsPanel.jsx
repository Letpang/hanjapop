import LearningStatCard from './learning-stats/LearningStatCard.jsx';
import { buildStatusItems } from './learning-stats/learningStatsItems.js';
import { useLang } from '../../../hooks/useLang.js';

const LearningStatsPanel = ({ stats, streakCount, isDarkMode }) => {
  const { t } = useLang();

  return (
    <div className="w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-white border-white dark:bg-slate-800 dark:border-slate-700">
      <div className="px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] border-[#E5EAF2] bg-white dark:border-slate-700 dark:bg-slate-800">
        <h3 className="font-medium text-base tracking-normal text-[#3C3C3C] dark:text-slate-100">{t('ext_700')}</h3>
      </div>
      <div className="grid grid-cols-2 p-4 gap-3">
        {buildStatusItems(stats, streakCount, t).map((item) => (
          <LearningStatCard key={item.key} item={item} isDarkMode={isDarkMode} />
        ))}
      </div>
    </div>
  );
};

export default LearningStatsPanel;